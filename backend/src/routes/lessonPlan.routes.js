import { Router } from 'express';
import lessonPlanModel from '../models/lessonPlan.model.js';
import { generateLessonPlanController } from '../controllers/lessonGeneration.controller.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';
import validate from '../middlewares/validate.js';
import {
  createLessonPlanValidation,
  updateLessonPlanValidation,
  updateLessonPlanStatusValidation,
} from '../validations/lessonPlan.validation.js';
import authenticate from '../middlewares/auth.middleware.js';

const router = Router();

const getAllLessonPlansController = asyncHandler(async (req, res) => {
  const plans = await lessonPlanModel.getAllLessonPlans({ userId: req.workspaceUserId });
  return successResponse(res, plans, API_MESSAGES.LESSON_PLANS_FETCHED);
});

const createLessonPlanController = asyncHandler(async (req, res) => {
  const plan = await lessonPlanModel.createLessonPlan({ ...req.body, userId: req.workspaceUserId });
  return createdResponse(res, plan, API_MESSAGES.LESSON_PLAN_CREATED);
});

const getLessonPlanByIdController = asyncHandler(async (req, res) => {
  const plan = await lessonPlanModel.getLessonPlanById(req.params.id);
  return successResponse(res, plan, API_MESSAGES.SUCCESS);
});

const updateStatus = asyncHandler(async (req, res) => {
  const plan = await lessonPlanModel.updateLessonPlanStatus(req.params.id, req.body.status);
  return successResponse(res, plan, 'Status updated successfully');
});

const updatePriority = asyncHandler(async (req, res) => {
  const plan = await lessonPlanModel.updateLessonPlanPriority(req.params.id, req.body.priority);
  return successResponse(res, plan, 'Priority updated successfully');
});

const updateLessonPlanController = asyncHandler(async (req, res) => {
  const plan = await lessonPlanModel.updateLessonPlan(req.params.id, req.body);
  return successResponse(res, plan, API_MESSAGES.LESSON_PLAN_UPDATED);
});

const deleteLessonPlanController = asyncHandler(async (req, res) => {
  await lessonPlanModel.deleteLessonPlan(req.params.id);
  return successResponse(res, null, API_MESSAGES.LESSON_PLAN_DELETED);
});

// student written: remove validation here because generation needs different inputs than saving (like no weekNumber needed yet)
router.post('/generate', generateLessonPlanController);
router.get('/', getAllLessonPlansController);
router.post('/', createLessonPlanValidation, validate, createLessonPlanController);
router.get('/:id', getLessonPlanByIdController);
router.patch('/:id/status', updateLessonPlanStatusValidation, validate, updateStatus);
router.patch('/:id/priority', updatePriority);
router.put('/:id', updateLessonPlanValidation, validate, updateLessonPlanController);
router.delete('/:id', deleteLessonPlanController);

export default router;
