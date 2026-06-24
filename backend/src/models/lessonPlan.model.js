import admin from 'firebase-admin';
import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withFirebaseErrorHandling } from '../utils/firebaseErrorHandler.js';
import notImplemented from '../utils/notImplemented.js';

const { FieldValue } = admin.firestore;

class LessonPlanModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.LESSON_PLANS);
  }

  _formatTimestamp(timestamp) {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    return timestamp;
  }

  _formatDocument(doc) {
    if (!doc.exists) return null;

    const data = doc.data();

    return {
      id: doc.id,
      userId: data.userId,
      ageGroup: data.ageGroup,
      theme: data.theme,
      learningOutcome: data.learningOutcome,
      weekNumber: data.weekNumber,
      duration: data.duration,
      notes: data.notes ?? '',
      status: data.status || 'New',
      priority: data.priority || 'Medium',
      weeklyPlan: data.weeklyPlan || null,
      activities: data.activities || [],
      materials: data.materials || [],
      learningGoals: data.learningGoals || [],
      lessonFlow: data.lessonFlow || [],
      teacherQuestions: data.teacherQuestions || [],
      teachingTips: data.teachingTips || [],
      weeklyDays: data.weeklyDays || null,
      contextFacts: data.contextFacts || [],
      createdAt: this._formatTimestamp(data.createdAt),
      updatedAt: this._formatTimestamp(data.updatedAt),
    };
  }

  async createLessonPlan(data) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const docRef = await collection.add({
        ...data,
        userId: data.userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const snapshot = await docRef.get();
      return this._formatDocument(snapshot);
    });
  }

  async getAllLessonPlans(filters = {}) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      let query = collection;
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      
      const snapshot = await query.limit(100).get();

      return snapshot.docs
        .map((doc) => this._formatDocument(doc))
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
    });
  }

  async getLessonPlanById(id) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.doc(id).get();
      return this._formatDocument(snapshot);
    });
  }

  async updateLessonPlan(id, data) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const docRef = collection.doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return null;
      }

      await docRef.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      return this._formatDocument(updated);
    });
  }

  async deleteLessonPlan(id) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const docRef = collection.doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return null;
      }

      await docRef.delete();
      return { id };
    });
  }

  async updateLessonPlanStatus(id, status) {
    return this.updateLessonPlan(id, { status });
  }

  async updateLessonPlanPriority(id, priority) {
    return this.updateLessonPlan(id, { priority });
  }
}

export default new LessonPlanModel();
