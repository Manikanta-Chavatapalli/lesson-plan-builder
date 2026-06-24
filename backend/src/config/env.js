
export const parsePrivateKey = (rawKey) => {
  if (!rawKey) return '';

  let key = rawKey.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, '\n');
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY || ''),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';

export const isFirebaseConfigured = () => {
  const { projectId, clientEmail, privateKey } = env.firebase;
  return Boolean(projectId && clientEmail && privateKey);
};

export default env;
