import firebaseClient from '../utils/firebaseClient.js';
import { COLLECTIONS } from '../constants/collections.js';

class FirebaseService {
  init() {
    return firebaseClient.init();
  }

  getDb() {
    return firebaseClient.getFirestore();
  }

  getApp() {
    return firebaseClient.getApp();
  }

  isReady() {
    return firebaseClient.isReady();
  }

  getCollection(collectionName) {
    return firebaseClient.getCollection(collectionName);
  }

  getLessonPlansCollection() {
    return firebaseClient.getCollection(COLLECTIONS.LESSON_PLANS);
  }

  getLessonPlanHistoryCollection() {
    return firebaseClient.getCollection(COLLECTIONS.LESSON_PLAN_HISTORY);
  }

  getRecommendationsCollection() {
    return firebaseClient.getCollection(COLLECTIONS.RECOMMENDATIONS);
  }

  getEnquiriesCollection() {
    return firebaseClient.getCollection(COLLECTIONS.ENQUIRIES);
  }

  getTeacherTasksCollection() {
    return firebaseClient.getCollection(COLLECTIONS.TEACHER_TASKS);
  }

  getCommunicationHistoryCollection() {
    return firebaseClient.getCollection(COLLECTIONS.COMMUNICATION_HISTORY);
  }
}

const firebaseService = new FirebaseService();

export default firebaseService;
