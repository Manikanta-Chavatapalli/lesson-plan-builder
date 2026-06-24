import { errorResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';
import { API_MESSAGES } from '../constants/messages.js';
import logger from '../utils/logger.js';

const buildErrorPayload = (code, details = null) => {
  const payload = { code };

  if (details) {
    payload.details = details;
  }

  return payload;
};

export const errorHandler = (err, req, res, _next) => {
  if (err.errors && Array.isArray(err.errors)) {
    return errorResponse(res, API_MESSAGES.VALIDATION_FAILED, 400, {
      error: buildErrorPayload('VALIDATION_ERROR', err.errors),
    });
  }

  if (err instanceof AppError) {
    logger.warn(err.message, {
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
    });

    return errorResponse(res, err.message, err.statusCode, {
      error: buildErrorPayload(err.errorCode, err.errors || null),
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? API_MESSAGES.INTERNAL_ERROR : err.message || API_MESSAGES.INTERNAL_ERROR;

  logger.error(message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  return errorResponse(res, message, statusCode, {
    error: buildErrorPayload('INTERNAL_ERROR'),
  });
};

export const notFoundHandler = (req, res, _next) => {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, 404, {
    error: buildErrorPayload('NOT_FOUND'),
  });
};

export default errorHandler;
