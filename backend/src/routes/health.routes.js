import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    return successResponse(res, {}, API_MESSAGES.SERVER_RUNNING);
  })
);

export default router;
