import 'dotenv/config';
import app from './app.js';
import env from './config/env.js';
import firebaseClient from './utils/firebaseClient.js';
import logger from './utils/logger.js';

const startServer = () => {
  try {
    firebaseClient.init();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`, {
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
