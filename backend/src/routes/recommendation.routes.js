import { Router } from 'express';
import recommendationModel from '../models/recommendation.model.js';
import lessonPlanModel from '../models/lessonPlan.model.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';

import {
  generateRecommendationValidation,
  applyRecommendationValidation,
} from '../validations/recommendation.validation.js';

const router = Router();

const generateRecommendationsController = asyncHandler(async (req, res) => {
  const { lessonPlanId, ageGroup, theme, learningOutcome } = req.body;

  const recommendations = [
    { title: 'Add Visual Aids', description: 'Include more pictures for this age group.' },
    { title: 'Interactive Activity', description: 'Include a hands-on activity.' }
  ];

  const result = await recommendationModel.createRecommendation({
    lessonPlanId,
    ageGroup,
    theme,
    learningOutcome,
    recommendations,
    status: 'generated'
  });

  return createdResponse(res, result, 'Recommendations generated successfully');
});

const applyRecommendationsController = asyncHandler(async (req, res) => {
  const { recommendationId, selectedRecommendations } = req.body;
  
  const recommendation = await recommendationModel.getRecommendationById(recommendationId);
  if (!recommendation) {
    throw new AppError('Recommendation not found', HTTP_STATUS.NOT_FOUND);
  }

  const updated = await recommendationModel.updateRecommendation(recommendationId, {
    status: 'applied',
    selectedRecommendations
  });

  return successResponse(res, updated, 'Recommendations applied successfully');
});

const getRecommendationsByLessonIdController = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const recommendations = await recommendationModel.getRecommendationsByLessonId(lessonId);
  return successResponse(res, recommendations, 'Recommendations fetched successfully');
});

router.post('/generate', generateRecommendationValidation, validate, generateRecommendationsController);
router.put('/apply', applyRecommendationValidation, validate, applyRecommendationsController);
router.get('/:lessonId', getRecommendationsByLessonIdController);

export default router;
