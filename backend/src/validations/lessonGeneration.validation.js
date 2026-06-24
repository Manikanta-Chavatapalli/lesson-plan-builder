

import { body } from 'express-validator';

export const generateLessonValidation = [
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
  body('save')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('save must be a boolean'),
  body('weekNumber')
    .optional()
    .isNumeric()
    .withMessage('weekNumber must be a number'),
  body('duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('duration cannot be empty'),
  body('notes')
    .optional()
    .isString()
    .withMessage('notes must be a string'),
];

export default generateLessonValidation;
