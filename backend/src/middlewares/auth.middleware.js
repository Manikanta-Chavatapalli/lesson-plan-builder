import { getFirebaseApp } from '../config/firebase.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import authModel from '../models/auth.model.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const token = header.split(' ')[1];
    const firebaseApp = getFirebaseApp();
    
    if (!firebaseApp) {
       throw new AppError('Auth not initialized', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'AUTH_ERROR');
    }

    const decodedToken = await firebaseApp.auth().verifyIdToken(token);
    const user = await authModel.findByEmail(decodedToken.email);
    if (!user) {
        throw new AppError('User not found in system', HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    req.user = user;
    req.workspaceUserId = `${user.id}_${user.role}`;
    next();
  } catch (error) {
    if (error.code?.startsWith('auth/')) {
        console.error('Firebase Auth Error:', error);
        next(new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN'));
    } else {
        console.error('Auth Middleware Error:', error);
        next(error);
    }
  }
};

export default authenticate;
