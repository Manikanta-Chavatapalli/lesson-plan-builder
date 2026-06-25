import 'dotenv/config';
import app from './app.js';
import env from './config/env.js';
import firebaseClient from './utils/firebaseClient.js';
import logger from './utils/logger.js';

const startServer = () => {
  try {
    // Initialize Firebase
    firebaseClient.init();

    // ✅ IMPORTANT: Use Render PORT or fallback
    const PORT = process.env.PORT || env.port || 5000;

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: env.nodeEnv,
        firebaseReady: firebaseClient.isReady(),
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();