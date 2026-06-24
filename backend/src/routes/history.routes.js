import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';
import { Router } from 'express';

class HistoryService {
  async findAll(_filters = {}) {
    return [];
  }

  async findByLessonId(_lessonId) {
    return [];
  }
}

export const historyService = new HistoryService();

const findAll = asyncHandler(async (req, res) => {
  const data = await historyService.findAll(req.query);
  return successResponse(res, data, API_MESSAGES.HISTORY_FETCHED);
});

const findByLessonId = asyncHandler(async (req, res) => {
  const data = await historyService.findByLessonId(req.params.lessonId);
  return successResponse(res, data, API_MESSAGES.HISTORY_FETCHED);
});

const router = Router();

router.get('/', findAll);
router.get('/:lessonId', findByLessonId);

export default router;
