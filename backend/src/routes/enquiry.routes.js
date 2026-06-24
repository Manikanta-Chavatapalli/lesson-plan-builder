import admin from 'firebase-admin';
import { sendEmail } from '../utils/mailer.js';
import { userService } from './user.routes.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { activityLogService } from './activityLog.routes.js';
import enquiryModel from '../models/enquiry.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';

import sseService from '../utils/sse.js';
import { alertService } from './alert.routes.js';
import { Router } from 'express';
import authenticate from '../middlewares/auth.middleware.js';

class EnquiryService {
  async getTeachers() {
    const users = await userService.getAllUsers();
    return users.filter(u => u.role === 'teacher').map(t => ({ id: t.id, name: t.name || t.email, email: t.email }));
  }

  async create(data) {
    const { parentName, parentEmail, studentName, studentClass, studentSection, message, teacherEmail, roleTarget } = data;

    let teacher = null;
    if (roleTarget !== 'counsellor') {
      teacher = await userService.getUserByEmail(teacherEmail);
      if (!teacher || teacher.role !== 'teacher') {
        throw new AppError('Invalid teacher selected', HTTP_STATUS.BAD_REQUEST, 'INVALID_TEACHER');
      }
    }

    const newEnquiry = await enquiryModel.create({
      parentName,
      parentEmail,
      studentName: studentName || 'Not Provided',
      studentClass: studentClass || 'Not Provided',
      studentSection: studentSection || 'Not Provided',
      message,
      teacherEmail: teacher ? teacher.email : null,
      roleTarget: roleTarget || 'teacher',
      status: 'new'
    });

    if (teacher) {
      try {
        const subject = 'New Parent Enquiry';
        const text = `Parent Name: ${parentName}\nParent Email: ${parentEmail}\nStudent: ${newEnquiry.studentName} (Class: ${newEnquiry.studentClass}, Section: ${newEnquiry.studentSection})\n\nMessage:\n${message}`;
        await sendEmail(teacher.email, subject, text);

        await activityLogService.create({
          recordId: newEnquiry.id,
          userId: teacher.id,
          type: 'enquiry',
          action: 'Created',
          message: 'New enquiry created and email sent'
        });
      } catch (emailError) {
        console.error('Failed to send email to teacher, but enquiry was created:', emailError);

        await activityLogService.create({
          recordId: newEnquiry.id,
          userId: teacher.id,
          type: 'enquiry',
          action: 'Created',
          message: 'New enquiry created (email delivery failed)'
        });
      }
    }

    return newEnquiry;
  }

  async getEnquiriesForTeacher(teacherEmail) {
    const allEnquiries = await enquiryModel.findAll();
    return allEnquiries.filter(e => e.teacherEmail && e.teacherEmail.toLowerCase() === teacherEmail.toLowerCase());
  }

  async findAll() {
    return await enquiryModel.findAll();
  }

  async findById(id) {
    const enquiry = await enquiryModel.findById(id);
    if (!enquiry) {
      throw new AppError('Enquiry not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    return enquiry;
  }

  async updateStatus(id, status, responseMessage, userId, respondedBy = null) {
    const existing = await enquiryModel.findById(id);
    if (!existing) throw new AppError('Enquiry not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    
    const updateData = { status };
    
    if (status === 'responded') {
      updateData.respondedAt = admin.firestore.FieldValue.serverTimestamp();
      if (responseMessage) updateData.responseMessage = responseMessage;
      if (respondedBy) updateData.respondedBy = respondedBy;
    }
    
    const updated = await enquiryModel.update(id, updateData);

    await activityLogService.create({
      recordId: id,
      userId: userId,
      type: 'enquiry',
      action: 'Status Changed',
      message: `Status changed to ${status}`
    });

    return updated;
  }

  async updatePriority(id, priority, userId) {
    const existing = await enquiryModel.findById(id);
    if (!existing) throw new AppError('Enquiry not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    
    const updated = await enquiryModel.update(id, { priority });

    await activityLogService.create({
      recordId: id,
      userId: userId,
      type: 'enquiry',
      action: 'Priority Changed',
      message: `Priority changed to ${priority}`
    });

    return updated;
  }

  async delete(id) {
    const result = await enquiryModel.delete(id);
    if (!result) {
      throw new AppError('Enquiry not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    return result;
  }
}

export const enquiryService = new EnquiryService();

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await enquiryService.getTeachers();
  return successResponse(res, teachers, 'Teachers fetched successfully');
});

const create = asyncHandler(async (req, res) => {
  const data = await enquiryService.create(req.body);
  sseService.broadcast({ type: 'NEW_ALERT' });
  return createdResponse(res, data, API_MESSAGES.ENQUIRY_CREATED);
});

const getTeacherEnquiries = asyncHandler(async (req, res) => {
  const data = await enquiryService.getEnquiriesForTeacher(req.user.email);
  return successResponse(res, data, API_MESSAGES.ENQUIRIES_FETCHED);
});

const findAll = asyncHandler(async (req, res) => {
  const data = await enquiryService.findAll();
  return successResponse(res, data, API_MESSAGES.ENQUIRIES_FETCHED);
});

const findById = asyncHandler(async (req, res) => {
  const data = await enquiryService.findById(req.params.id);
  return successResponse(res, data, API_MESSAGES.SUCCESS);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, responseMessage } = req.body;

  if (status && status.toLowerCase() === 'responded' && responseMessage) {

    const enquiry = await enquiryService.findById(req.params.id);
    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found');
    }

    const { default: emailService } = await import('../utils/email.js');
    emailService.sendEnquiryResponse(
      enquiry.parentEmail,
      enquiry.parentName,
      enquiry.message,
      responseMessage
    ).catch(err => console.error('Failed to send response email:', err));
  }

  const respondedBy = req.user.role === 'counsellor' ? 'counsellor' : (req.user.role === 'teacher' ? 'teacher' : null);
  const data = await enquiryService.updateStatus(req.params.id, status ? status.toLowerCase() : status, responseMessage, req.user.id, respondedBy);

  alertService.acknowledgeByActionLink(`/enquiries/${req.params.id}/verify`);

  return successResponse(res, data, 'Status updated and email sent successfully');
});

const deleteEnquiry = asyncHandler(async (req, res) => {
  const data = await enquiryService.delete(req.params.id);

  alertService.acknowledgeByActionLink(`/enquiries/${req.params.id}/verify`);

  return successResponse(res, data, 'Enquiry deleted successfully');
});

const rejectEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }

  const { default: emailService } = await import('../utils/email.js');
  emailService.sendRejectionEmail(
    enquiry.parentEmail,
    enquiry.parentName,
    enquiry.message,
    "Your enquiry has been cancelled or declined by the administration."
  ).catch(err => console.error('Failed to send rejection email:', err));

  const data = await enquiryService.delete(req.params.id);

  alertService.acknowledgeByActionLink(`/enquiries/${req.params.id}/verify`);

  return successResponse(res, data, 'Enquiry rejected and deleted successfully');
});

const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  const data = await enquiryService.updatePriority(req.params.id, priority, req.user.id);
  return successResponse(res, data, 'Priority updated successfully');
});

const router = Router();

router.get('/teachers', getTeachers);
router.post('/', create);

router.get('/teacher/enquiries', authenticate, getTeacherEnquiries);
router.get('/', authenticate, findAll);
router.get('/:id', authenticate, findById);
router.patch('/:id/status', authenticate, updateStatus);
router.patch('/:id/priority', authenticate, updatePriority);
router.post('/:id/reject', authenticate, rejectEnquiry);
router.delete('/:id', authenticate, deleteEnquiry);

export default router;
