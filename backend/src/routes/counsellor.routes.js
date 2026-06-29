import admin from 'firebase-admin';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import enquiryModel from '../models/enquiry.model.js';
import { userService } from './user.routes.js';
import { activityLogService } from './activityLog.routes.js';
import { sendEmail } from '../utils/mailer.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { Router } from 'express';
import authenticate from '../middlewares/auth.middleware.js';
import sseService from '../utils/sse.js';

class CounsellorService {
  async getTeacherStats() {
    const users = await userService.getAllUsers();
    const teachers = users.filter(u => u.role === 'teacher').map(t => ({ id: t.id, name: t.name || t.email, email: t.email }));
    
    const allEnquiries = await enquiryModel.findAll();
    
    const stats = teachers.map(teacher => {
      const teacherEnquiries = allEnquiries.filter(e => e.teacherEmail && e.teacherEmail.toLowerCase() === teacher.email.toLowerCase());
      const responded = teacherEnquiries.filter(e => e.status?.toLowerCase() === 'responded' || e.status?.toLowerCase() === 'completed');
      const notResponded = teacherEnquiries.filter(e => e.status?.toLowerCase() !== 'responded' && e.status?.toLowerCase() !== 'completed');
      return {
        ...teacher,
        totalEnquiries: teacherEnquiries.length,
        respondedCount: responded.length,
        notRespondedCount: notResponded.length
      };
    });
    
    return stats;
  }

  async getTeacherEnquiries(teacherEmail) {
    const allEnquiries = await enquiryModel.findAll();
    return allEnquiries.filter(e => e.teacherEmail && e.teacherEmail.toLowerCase() === teacherEmail.toLowerCase());
  }

  async getCounsellorAlerts() {
    const allEnquiries = await enquiryModel.findAll();
    return allEnquiries.filter(e => e.roleTarget === 'counsellor' && e.status?.toLowerCase() === 'new');
  }

  async acceptAlert(id, userId) {
    const existing = await enquiryModel.findById(id);
    if (!existing || existing.roleTarget !== 'counsellor' || existing.status?.toLowerCase() !== 'new') {
      throw new AppError('Alert not found or already accepted', HTTP_STATUS.BAD_REQUEST, 'INVALID_ALERT');
    }
    
    const updated = await enquiryModel.update(id, {
      status: 'pending',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await activityLogService.create({
      recordId: id,
      userId,
      type: 'enquiry',
      action: 'Accepted',
      message: 'Counsellor accepted enquiry'
    });

    return updated;
  }

  async deleteAlert(id, userId) {
    const existing = await enquiryModel.findById(id);
    if (!existing || existing.roleTarget !== 'counsellor') {
      throw new AppError('Alert not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    
    const updated = await enquiryModel.update(id, {
      status: 'deleted'
    });

    await activityLogService.create({
      recordId: id,
      userId,
      type: 'enquiry',
      action: 'Deleted',
      message: 'Counsellor deleted alert'
    });

    return updated;
  }

  async getCounsellorEnquiries() {
    const allEnquiries = await enquiryModel.findAll();
    return allEnquiries.filter(e => e.roleTarget === 'counsellor' && (e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'responded'));
  }

  async respondToEnquiry(id, responseMessage, userId, userName) {
    const existing = await enquiryModel.findById(id);
    if (!existing) {
      throw new AppError('Enquiry not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    
    const updateData = {
      status: 'responded',
      responseMessage,
      respondedBy: userId,
      respondedByName: userName,
      respondedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const updated = await enquiryModel.update(id, updateData);

    const { default: emailService } = await import('../utils/email.js');
    try {
      await emailService.sendEnquiryResponse(
        existing.parentEmail,
        existing.parentName,
        existing.message,
        responseMessage
      );
    } catch (err) {
      console.error('Failed to send response email:', err);
    }

    await activityLogService.create({
      recordId: id,
      userId,
      type: 'enquiry',
      action: 'Responded',
      message: 'Counsellor responded to enquiry'
    });

    return updated;
  }
}

export const counsellorService = new CounsellorService();

const getTeacherStats = asyncHandler(async (req, res) => {
  const data = await counsellorService.getTeacherStats();
  return successResponse(res, data, 'Teacher stats fetched successfully');
});

const getTeacherEnquiries = asyncHandler(async (req, res) => {
  const data = await counsellorService.getTeacherEnquiries(req.params.email);
  return successResponse(res, data, 'Teacher enquiries fetched successfully');
});

const getCounsellorAlerts = asyncHandler(async (req, res) => {
  const data = await counsellorService.getCounsellorAlerts();
  return successResponse(res, data, 'Counsellor alerts fetched successfully');
});

const acceptAlert = asyncHandler(async (req, res) => {
  const data = await counsellorService.acceptAlert(req.params.id, req.workspaceUserId);
  return successResponse(res, data, 'Alert accepted successfully');
});

const deleteAlert = asyncHandler(async (req, res) => {
  const data = await counsellorService.deleteAlert(req.params.id, req.workspaceUserId);
  return successResponse(res, data, 'Alert deleted successfully');
});

const getCounsellorEnquiries = asyncHandler(async (req, res) => {
  const data = await counsellorService.getCounsellorEnquiries();
  return successResponse(res, data, 'Counsellor enquiries fetched successfully');
});

const respondToEnquiry = asyncHandler(async (req, res) => {
  const { responseMessage } = req.body;
  if (!responseMessage) {
    res.status(400);
    throw new Error('Response message is required');
  }
  const data = await counsellorService.respondToEnquiry(req.params.id, responseMessage, req.workspaceUserId, req.user.name);
  sseService.broadcast({ type: 'NEW_ALERT' });
  return successResponse(res, data, 'Responded successfully');
});

const router = Router();

const restrictToCounsellor = (req, res, next) => {
  if (req.user && req.user.role === 'counsellor') {
    next();
  } else {
    res.status(403);
    next(new Error('Access denied. Counsellor role required.'));
  }
};

router.use(authenticate);
router.use(restrictToCounsellor);

router.get('/teacher-stats', getTeacherStats);
router.get('/teacher-enquiries/:email', getTeacherEnquiries);

router.get('/alerts', getCounsellorAlerts);
router.patch('/alerts/:id/accept', acceptAlert);
router.delete('/alerts/:id', deleteAlert);

router.get('/enquiries', getCounsellorEnquiries);
router.post('/enquiries/:id/respond', respondToEnquiry);

export default router;
