import { body } from 'express-validator';

export const generateRecommendationValidation = [
  body('ageGroup')
    .trim()
    .notEmpty()
    .withMessage('ageGroup is required'),
  body('theme')
    .trim()
    .notEmpty()
    .withMessage('theme is required'),
  body('learningOutcome')
    .trim()
    .notEmpty()
    .withMessage('learningOutcome is required'),
  body('existingLessonPlanId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('existingLessonPlanId cannot be empty'),
];

export const applyRecommendationValidation = [
  body('recommendationId')
    .trim()
    .notEmpty()
    .withMessage('recommendationId is required'),
  body('action')
    .trim()
    .notEmpty()
    .withMessage('action is required')
    .isIn(['accept', 'reject', 'edit'])
    .withMessage('action must be accept, reject, or edit'),
  body('editedRecommendations')
    .optional()
    .isObject()
    .withMessage('editedRecommendations must be an object'),
  body('attachToLessonPlan')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('attachToLessonPlan must be a boolean'),
];

export default {
  generateRecommendationValidation,
  applyRecommendationValidation,
};
