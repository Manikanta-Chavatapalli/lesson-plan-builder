import { validationResult } from 'express-validator';
import { AppError } from '../errors/AppError.js';
import { API_MESSAGES } from '../constants/messages.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationError = new AppError(
      API_MESSAGES.VALIDATION_FAILED,
      400,
      'VALIDATION_ERROR'
    );
    validationError.errors = errors.array();
    return next(validationError);
  }

  next();
};

export default validate;
