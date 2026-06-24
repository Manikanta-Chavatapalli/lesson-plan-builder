import {
  initializeFirebase,
  getFirestore as getDb,
  getFirebaseApp as getApp,
  isFirebaseReady,
} from '../config/firebase.js';
import logger from './logger.js';

class FirebaseClient {
  constructor() {
    this._initialized = false;
  }

  init() {
    if (this._initialized && isFirebaseReady()) {
      return getDb();
    }

    const { db } = initializeFirebase();
    this._initialized = true;

    if (db) {
      logger.info('[FirebaseClient] Firestore connection ready');
    }

    return db;
  }

  getFirestore() {
    return getDb();
  }

  getApp() {
    return getApp();
  }

  getCollection(collectionName) {
    const db = this.getFirestore();

    if (!db) {
      logger.warn('[FirebaseClient] Firestore not available', { collectionName });
      return null;
    }

    return db.collection(collectionName);
  }

  isReady() {
    return isFirebaseReady();
  }
}

const firebaseClient = new FirebaseClient();

export default firebaseClient;
