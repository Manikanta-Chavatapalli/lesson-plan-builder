import lessonPlanModel from '../models/lessonPlan.model.js';
import { enquiryService } from './enquiry.routes.js';
import { alertService } from './alert.routes.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';
import { Router } from 'express';

class DashboardService {
  async getStats(filters = {}) {
    const { teacherEmail, userId } = filters;
    const lessonPlans = await lessonPlanModel.getAllLessonPlans({ userId });
    
    const enquiries = teacherEmail ? await enquiryService.getEnquiriesForTeacher(teacherEmail) : await enquiryService.findAll();
    const alerts = await alertService.findAll({ teacherEmail, userId });

    const pendingEnquiries = enquiries.filter(e => e.status?.toLowerCase() !== 'responded' && e.status?.toLowerCase() !== 'completed');
    const respondedEnquiries = enquiries.filter(e => e.status?.toLowerCase() === 'responded' || e.status?.toLowerCase() === 'completed');
    const unreadAlerts = alerts.filter(a => a.type === 'warning' || a.type === 'info' || a.status === 'unread');

    return {
      totalEnquiries: enquiries.length,
      pendingEnquiries: pendingEnquiries.length,
      respondedEnquiries: respondedEnquiries.length,
      lessonPlansCreated: lessonPlans.length,
      unreadAlerts: unreadAlerts.length
    };
  }

  async getRecentPlans(filters = {}) {
    const { userId } = filters;
    const plans = await lessonPlanModel.getAllLessonPlans({ userId });
    return plans.slice(0, 5);
  }

  async getUnifiedRecords(filters = {}) {
    const { teacherEmail, userId } = filters;
    const lessonPlans = await lessonPlanModel.getAllLessonPlans({ userId });
    
    const enquiries = teacherEmail ? await enquiryService.getEnquiriesForTeacher(teacherEmail) : await enquiryService.findAll();

    const formattedPlans = lessonPlans.map(plan => ({
      id: plan.id,
      title: plan.theme,
      type: 'Lesson Plan',
      status: plan.status || 'New',
      priority: plan.priority || 'Medium',
      date: plan.createdAt,
      teacher: 'System',
      preview: plan.learningOutcome ? plan.learningOutcome.substring(0, 100) : 'No summary available'
    }));

    const formattedEnquiries = enquiries.map(enq => ({
      id: enq.id,
      title: `From: ${enq.parentName}`,
      type: 'Enquiry',
      status: enq.status || 'New',
      priority: enq.priority || 'Medium',
      date: enq.createdAt,
      teacher: enq.teacherEmail || 'Unassigned',
      preview: enq.message ? enq.message.substring(0, 100) : 'No message available'
    }));

    const unifiedList = [...formattedPlans, ...formattedEnquiries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return unifiedList;
  }
}

export const dashboardService = new DashboardService();

const getStats = asyncHandler(async (req, res) => {
  const filters = { ...req.query, userId: req.workspaceUserId, teacherEmail: req.user.email };
  const data = await dashboardService.getStats(filters);
  return successResponse(res, data, API_MESSAGES.DASHBOARD_STATS_FETCHED);
});

const getRecentPlans = asyncHandler(async (req, res) => {
  const filters = { ...req.query, userId: req.workspaceUserId };
  const data = await dashboardService.getRecentPlans(filters);
  return successResponse(res, data, API_MESSAGES.RECENT_PLANS_FETCHED);
});

const getUnifiedRecords = asyncHandler(async (req, res) => {
  const filters = { ...req.query, userId: req.workspaceUserId, teacherEmail: req.user.email };
  const data = await dashboardService.getUnifiedRecords(filters);
  return successResponse(res, data, 'Unified records fetched successfully');
});

const router = Router();
router.get('/stats', getStats);
router.get('/recent-plans', getRecentPlans);
router.get('/unified', getUnifiedRecords);

export default router;
