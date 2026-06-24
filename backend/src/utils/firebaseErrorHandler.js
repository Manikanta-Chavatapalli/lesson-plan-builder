import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/statuses.js';

const FIREBASE_ERROR_MAP = {
  'permission-denied': {
    statusCode: HTTP_STATUS.FORBIDDEN,
    errorCode: 'FIREBASE_PERMISSION_DENIED',
    message: 'Firebase permission denied',
  },
  'not-found': {
    statusCode: HTTP_STATUS.NOT_FOUND,
    errorCode: 'FIREBASE_NOT_FOUND',
    message: 'Firebase resource not found',
  },
  'already-exists': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    errorCode: 'FIREBASE_ALREADY_EXISTS',
    message: 'Firebase resource already exists',
  },
  'invalid-argument': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    errorCode: 'FIREBASE_INVALID_ARGUMENT',
    message: 'Invalid Firebase argument',
  },
  'failed-precondition': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    errorCode: 'FIREBASE_FAILED_PRECONDITION',
    message: 'Firebase operation failed precondition',
  },
  'unavailable': {
    statusCode: 503,
    errorCode: 'FIREBASE_UNAVAILABLE',
    message: 'Firebase service unavailable',
  },
  'deadline-exceeded': {
    statusCode: 504,
    errorCode: 'FIREBASE_TIMEOUT',
    message: 'Firebase operation timed out',
  },
  'unauthenticated': {
    statusCode: 401,
    errorCode: 'FIREBASE_UNAUTHENTICATED',
    message: 'Firebase authentication failed',
  },
};

export const handleFirebaseError = (error) => {
  const code = error?.code || 'unknown';
  const mapped = FIREBASE_ERROR_MAP[code];

  if (mapped) {
    return new AppError(
      error.message || mapped.message,
      mapped.statusCode,
      mapped.errorCode
    );
  }

  return new AppError(
    error?.message || 'Firebase operation failed',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'FIREBASE_ERROR'
  );
};

export const withFirebaseErrorHandling = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw handleFirebaseError(error);
  }
};

export default handleFirebaseError;
