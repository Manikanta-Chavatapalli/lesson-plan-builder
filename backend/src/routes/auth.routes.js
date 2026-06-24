import { getFirebaseApp } from '../config/firebase.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { sendEmail } from '../utils/mailer.js';
import { userService } from './user.routes.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';
import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate.js';
import authenticate from '../middlewares/auth.middleware.js';

const otpStore = new Map();
const blockStore = new Map();

class AuthService {
  async requestOtp(email) {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new AppError('Unauthorized access', HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const blockedUntil = blockStore.get(user.email);
    if (blockedUntil && Date.now() < blockedUntil) {
      const waitMinutes = Math.ceil((blockedUntil - Date.now()) / 60000);
      throw new AppError(`Too many failed attempts. Try again in ${waitMinutes} minutes.`, HTTP_STATUS.TOO_MANY_REQUESTS, 'BLOCKED');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000;

    otpStore.set(user.email, { otp, expiresAt, attempts: 0 });

    const subject = 'Your Login OTP';
    const text = `Your OTP for Lesson Plan Builder is ${otp}. It is valid for 3 minutes. Do not share this code.`;
    const emailSent = await sendEmail(user.email, subject, text);
    
    if (!emailSent) {
      console.log(`\n========================================`);
      console.log(`⚠️ EMAIL FAILED (Network/Firewall Blocked)`);
      console.log(`🔑 FALLBACK OTP for ${user.email}: ${otp}`);
      console.log(`========================================\n`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email, otp) {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new AppError('Unauthorized access', HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const blockedUntil = blockStore.get(user.email);
    if (blockedUntil && Date.now() < blockedUntil) {
      throw new AppError('Account temporarily blocked due to too many failed attempts.', HTTP_STATUS.TOO_MANY_REQUESTS, 'BLOCKED');
    }

    const record = otpStore.get(user.email);
    if (!record) {
      throw new AppError('No OTP requested or OTP expired', HTTP_STATUS.BAD_REQUEST, 'INVALID_OTP');
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(user.email);
      throw new AppError('OTP has expired', HTTP_STATUS.BAD_REQUEST, 'EXPIRED_OTP');
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      if (record.attempts >= 3) {
        blockStore.set(user.email, Date.now() + 5 * 60 * 1000);
        otpStore.delete(user.email);
        throw new AppError('Too many failed attempts. Blocked for 5 minutes.', HTTP_STATUS.TOO_MANY_REQUESTS, 'BLOCKED');
      }
      throw new AppError(`Invalid OTP. You have ${3 - record.attempts} attempts left.`, HTTP_STATUS.UNAUTHORIZED, 'INVALID_OTP');
    }

    otpStore.delete(user.email);

    sendEmail(user.email, 'Login Detected', 'A login to your account was detected.').catch(() => {});

    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) {
      throw new AppError('Firebase not initialized', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'AUTH_ERROR');
    }

    try {
      const customToken = await firebaseApp.auth().createCustomToken(user.id, { email: user.email });
      return { 
        user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
        token: customToken 
      };
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw new AppError('Failed to generate authentication token', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'TOKEN_ERROR');
    }
  }
}

export const authService = new AuthService();

const requestOtpController = asyncHandler(async (req, res) => {
  const result = await authService.requestOtp(req.body.email);
  return successResponse(res, result, 'OTP sent successfully');
});

const verifyOtpController = asyncHandler(async (req, res) => {
  const { user, token } = await authService.verifyOtp(req.body.email, req.body.otp);
  return successResponse(res, { user, token }, API_MESSAGES.LOGIN_SUCCESS);
});

const meController = asyncHandler(async (req, res) => {
  return successResponse(res, { user: req.user }, API_MESSAGES.SUCCESS);
});

const logoutController = asyncHandler(async (_req, res) => {
  return successResponse(res, {}, API_MESSAGES.LOGOUT_SUCCESS);
});

const router = Router();

const requestOtpValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

router.get('/', (req, res) => {
  res.json({
    message: 'Auth API working',
    routes: ['/request-otp', '/verify-otp', '/me', '/logout']
  });
});

router.post('/request-otp', requestOtpValidation, validate, requestOtpController);
router.post('/verify-otp', verifyOtpValidation, validate, verifyOtpController);
router.get('/me', authenticate, meController);
router.post('/logout', authenticate, logoutController);

export default router;
