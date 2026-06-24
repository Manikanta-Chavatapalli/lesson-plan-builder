import admin from 'firebase-admin';
import env, { isFirebaseConfigured } from './env.js';
import logger from '../utils/logger.js';

let firebaseApp = null;
let firestore = null;
export const initializeFirebase = () => {
  if (firestore && firebaseApp) {
    return { app: firebaseApp, db: firestore };
  }

  if (!isFirebaseConfigured()) {
    logger.warn('[Firebase] Missing credentials. Firestore unavailable.', {
      hasProjectId: Boolean(env.firebase.projectId),
      hasClientEmail: Boolean(env.firebase.clientEmail),
      hasPrivateKey: Boolean(env.firebase.privateKey),
    });
    return { app: null, db: null };
  }

  try {
    const { projectId, clientEmail, privateKey, storageBucket } = env.firebase;

    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        ...(storageBucket && { storageBucket }),
      });
    } else {
      firebaseApp = admin.app();
    }

    firestore = admin.firestore();

    logger.info('[Firebase] Admin SDK initialized successfully', {
      projectId,
      storageBucket: storageBucket || 'default',
    });

    return { app: firebaseApp, db: firestore };
  } catch (error) {
    logger.error('[Firebase] Initialization failed', {
      message: error.message,
    });
    throw error;
  }
};
export const getFirebaseApp = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
};
export const getFirestore = () => {
  if (!firestore) {
    initializeFirebase();
  }
  return firestore;
};
export const isFirebaseReady = () => firestore !== null;

export { firebaseApp, firestore };

export default {
  initializeFirebase,
  getFirebaseApp,
  getFirestore,
  isFirebaseReady,
};
