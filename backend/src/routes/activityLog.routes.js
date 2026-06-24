import activityLogModel from '../models/activityLog.model.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { Router } from 'express';

class ActivityLogService {
  async create(data) {
    if (!data.recordId || !data.type || !data.action || !data.message || !data.userId) {
      throw new AppError('Missing required fields for activity log', HTTP_STATUS.BAD_REQUEST);
    }

    const newActivity = {
      recordId: data.recordId,
      userId: data.userId,
      type: data.type,
      action: data.action,
      message: data.message,
      priority: data.priority || 'Low',
      date: data.date || new Date().toISOString()
    };

    return await activityLogModel.create(newActivity);
  }

  async getAll(userId = null) {
    return await activityLogModel.findAll(userId);
  }

  async delete(id) {
    const result = await activityLogModel.delete(id);
    if (!result) {
      throw new AppError('Activity log not found', HTTP_STATUS.NOT_FOUND);
    }
    return { success: true };
  }

  async getRecentActivity(limit = 10, userId = null) {
    const logs = await this.getAll(userId);
    return logs.slice(0, limit);
  }
}

export const activityLogService = new ActivityLogService();

const getAllActivity = asyncHandler(async (req, res) => {
  const data = await activityLogService.getAll(req.user.id);
  return successResponse(res, data, 'Activity fetched successfully');
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await activityLogService.getRecentActivity(10, req.user.id);
  return successResponse(res, data, 'Recent activity fetched successfully');
});

const deleteActivity = asyncHandler(async (req, res) => {
  await activityLogService.delete(req.params.id);
  return successResponse(res, null, 'Activity deleted successfully');
});

const router = Router();

router.get('/', getAllActivity);
router.get('/recent', getRecentActivity);
router.delete('/:id', deleteActivity);

export default router;
