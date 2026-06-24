import { Router } from 'express';
import sseService from '../utils/sse.js';

const router = Router();

import admin from 'firebase-admin';

router.get('/', async (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  sseService.addClient(res);
});

export default router;
