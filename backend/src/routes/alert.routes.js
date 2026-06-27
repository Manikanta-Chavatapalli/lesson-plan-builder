import lessonPlanModel from '../models/lessonPlan.model.js';
import { enquiryService } from './enquiry.routes.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';
import { Router } from 'express';

const acknowledgedAlerts = {}; // { alertId: timestamp }
const customAlerts = []; // Array of dynamically pushed alerts

class AlertService {
  async findAll(filters = {}) {
    const { userId, teacherEmail } = filters;
    const now = Date.now();
    Object.keys(acknowledgedAlerts).forEach(key => {
      if (now - acknowledgedAlerts[key] > 24 * 60 * 60 * 1000) {
        delete acknowledgedAlerts[key];
      }
    });

    const [plans, enquiries] = await Promise.all([
      lessonPlanModel.getAllLessonPlans({ userId }),
      teacherEmail ? enquiryService.getEnquiriesForTeacher(teacherEmail) : enquiryService.findAll()
    ]);

    let alerts = [...customAlerts];
    const unified = [
      ...plans.map(p => ({
        id: p.id,
        type: 'lessonPlan',
        title: p.theme || 'Untitled Lesson Plan',
        status: p.status || 'New',
        priority: p.priority || 'Medium',
        date: p.createdAt
      })),
      ...enquiries.map(e => ({
        id: e.id,
        type: 'enquiry',
        title: `Enquiry from ${e.parentName}`,
        status: e.status || 'New',
        priority: e.priority || 'Medium',
        date: e.createdAt,
        parentName: e.parentName,
        parentEmail: e.parentEmail,
        studentName: e.studentName,
        studentClass: e.studentClass,
        studentSection: e.studentSection,
        message: e.message
      }))
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    unified.forEach(record => {
      if (record.type === 'enquiry' && record.status?.toLowerCase() === 'new') {
        alerts.push({
          id: `alert-new-enq-${record.id}`,
          recordId: record.id,
          type: 'enquiry',
          message: `New Enquiry: ${record.title}`,
          priority: 'High',
          date: record.date || new Date().toISOString(),
          actionLink: `/enquiries/${record.id}/verify`,
          parentName: record.parentName,
          parentEmail: record.parentEmail,
          studentName: record.studentName,
          studentClass: record.studentClass,
          studentSection: record.studentSection,
          enquiryMessage: record.message
        });
      }
      if (record.status?.toLowerCase() !== 'completed' && record.status?.toLowerCase() !== 'responded') {
        alerts.push({
          id: `alert-status-${record.id}`,
          recordId: record.id,
          type: record.type,
          message: `Status Alert: '${record.title}' is ${record.status} with ${record.priority} priority.`,
          priority: record.priority,
          date: new Date().toISOString()
        });
      }
      if (record.status?.toLowerCase() === 'follow-up') {
        alerts.push({
          id: `alert-followup-${record.id}`,
          recordId: record.id,
          type: record.type,
          message: `Action Required: '${record.title}' is marked for Follow-up.`,
          priority: 'High',
          date: new Date().toISOString()
        });
      }
      if (record.status?.toLowerCase() !== 'completed' && record.status?.toLowerCase() !== 'responded' && record.date) {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        if (recordDate < today) {
          alerts.push({
            id: `alert-overdue-${record.id}`,
            recordId: record.id,
            type: record.type,
            message: `Overdue: '${record.title}' is still ${record.status}.`,
            priority: 'Medium',
            date: new Date().toISOString()
          });
        }
      }
    });
    return alerts.filter(a => !acknowledgedAlerts[a.id]);
  }

  async acknowledge(id) {
    acknowledgedAlerts[id] = Date.now();
    return { success: true, id };
  }

  addCustomAlert(message, type = 'info', actionLink = null) {
    customAlerts.push({
      id: `alert-custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      message,
      type,
      actionLink,
      timestamp: new Date().toISOString()
    });
  }

  acknowledgeByActionLink(actionLink) {
    const alertsToAck = customAlerts.filter(a => a.actionLink === actionLink);
    alertsToAck.forEach(a => {
      acknowledgedAlerts[a.id] = Date.now();
    });
  }
}

export const alertService = new AlertService();

const findAll = asyncHandler(async (req, res) => {
  const filters = { ...req.query, userId: req.user.id, teacherEmail: req.user.email };
  const data = await alertService.findAll(filters);
  return successResponse(res, data, API_MESSAGES.ALERTS_FETCHED);
});

const acknowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await alertService.acknowledge(id);
  return successResponse(res, data, 'Alert acknowledged successfully');
});

const router = Router();

router.get('/', findAll);
router.delete('/:id', acknowledge);

export default router;
