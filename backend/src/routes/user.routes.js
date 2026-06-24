import { Router } from 'express';
import { body } from 'express-validator';
import authModel from '../models/auth.model.js';
import validate from '../middlewares/validate.js';
import authenticate from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import bcrypt from 'bcryptjs';
import { activityLogService } from './activityLog.routes.js';
class UserService {
  async getUserByEmail(email) {
    return await authModel.findByEmail(email);
  }

  async getAllUsers() {
    return await authModel.findAll();
  }

  async createUser(data) {
    return await authModel.createUser(data);
  }

  async deleteUser(id) {
    return await authModel.deleteUser(id);
  }
}

export const userService = new UserService();

const checkUserController = asyncHandler(async (req, res) => {
  const user = await authModel.findByEmail(req.body.email);
  if (!user) {
    return successResponse(res, { exists: false }, 'User not found');
  }
  return successResponse(res, { exists: true, role: user.role, name: user.name }, 'User found');
});

const getAllUsersController = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return successResponse(res, users, 'Users fetched');
});

const createUserController = asyncHandler(async (req, res) => {
  const { email, role, name } = req.body;
  
  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const randomPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(randomPassword, 4); // Reduced from 10 to 4 to significantly speed up creation since OTP is used for login

  const newUser = await userService.createUser({ name, email, passwordHash, role });
  
  // Run log creation asynchronously to avoid delaying the response
  activityLogService.create({
    recordId: newUser.id,
    userId: req.user.id,
    type: 'user',
    action: 'Created',
    message: `Created new user ${name || 'Unknown'} (${email}) with role ${role}`
  }).catch(console.error);

  return createdResponse(res, newUser, 'User created');
});

const deleteUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const userToDelete = await authModel.findById(id);
  
  await userService.deleteUser(id);
  
  if (userToDelete) {
    // Run log creation asynchronously
    activityLogService.create({
      recordId: id,
      userId: req.user.id,
      type: 'user',
      action: 'Deleted',
      message: `Deleted user ${userToDelete.name || 'Unknown'} (${userToDelete.email}) with role ${userToDelete.role}`
    }).catch(console.error);
  }

  return successResponse(res, {}, 'User deleted');
});

const router = Router();

const checkUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const createUserValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['teacher', 'admin', 'counsellor']).withMessage('Role must be teacher, admin, or counsellor'),
];

router.post('/check-user', checkUserValidation, validate, checkUserController);
router.get('/', authenticate, getAllUsersController);
router.post('/', authenticate, createUserValidation, validate, createUserController);
router.delete('/:id', authenticate, deleteUserController);

export default router;
