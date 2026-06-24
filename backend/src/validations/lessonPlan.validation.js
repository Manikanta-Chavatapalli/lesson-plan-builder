import { body } from 'express-validator';

const lessonPlanFields = {
  ageGroup: body('ageGroup')
    .trim()
    .notEmpty()
    .withMessage('ageGroup is required'),
  theme: body('theme')
    .trim()
    .notEmpty()
    .withMessage('theme is required'),
  learningOutcome: body('learningOutcome')
    .trim()
    .notEmpty()
    .withMessage('learningOutcome is required'),
  weekNumber: body('weekNumber')
    .notEmpty()
    .withMessage('weekNumber is required')
    .isNumeric()
    .withMessage('weekNumber must be a number'),
  duration: body('duration')
    .trim()
    .notEmpty()
    .withMessage('duration is required'),
};

export const createLessonPlanValidation = [
  lessonPlanFields.ageGroup,
  lessonPlanFields.theme,
  lessonPlanFields.learningOutcome,
  lessonPlanFields.weekNumber,
  lessonPlanFields.duration,
  body('notes').optional().isString().withMessage('notes must be a string'),
];

export const updateLessonPlanValidation = [
  body('ageGroup').optional().trim().notEmpty().withMessage('ageGroup cannot be empty'),
  body('theme').optional().trim().notEmpty().withMessage('theme cannot be empty'),
  body('learningOutcome')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('learningOutcome cannot be empty'),
  body('weekNumber')
    .optional()
    .isNumeric()
    .withMessage('weekNumber must be a number'),
  body('duration').optional().trim().notEmpty().withMessage('duration cannot be empty'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  body('status').optional().isString().withMessage('status must be a string'),
];

export const updateLessonPlanStatusValidation = [];

export default {
  createLessonPlanValidation,
  updateLessonPlanValidation,
  updateLessonPlanStatusValidation,
};
