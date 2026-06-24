import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import lessonPlanRoutes from './routes/lessonPlan.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import historyRoutes from './routes/history.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import alertRoutes from './routes/alert.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';
import userRoutes from './routes/user.routes.js';
import counsellorRoutes from './routes/counsellor.routes.js';
import streamRoutes from './routes/stream.routes.js';
import authenticate from './middlewares/auth.middleware.js';

import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lesson-plans', authenticate, lessonPlanRoutes);
app.use('/api/recommendations', authenticate, recommendationRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/history', authenticate, historyRoutes);
app.use('/api/enquiries', enquiryRoutes); // Removed global auth for public posting
app.use('/api/alerts', authenticate, alertRoutes);
app.use('/api/activity', authenticate, activityLogRoutes);
app.use('/api/counsellor', counsellorRoutes);
app.use('/api/stream', streamRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lesson Plan Builder API is running 🚀',
    endpoints: {
      health: '/api',
      auth: '/api/auth',
      lessonPlans: '/api/lesson-plans',
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
