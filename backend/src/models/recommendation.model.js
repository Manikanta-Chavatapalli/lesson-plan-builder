import admin from 'firebase-admin';
import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withFirebaseErrorHandling } from '../utils/firebaseErrorHandler.js';

const { FieldValue } = admin.firestore;

class RecommendationModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.RECOMMENDATIONS);
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
      lessonPlanId: data.lessonPlanId ?? null,
      ageGroup: data.ageGroup,
      theme: data.theme,
      learningOutcome: data.learningOutcome,
      recommendations: data.recommendations,
      status: data.status,
      createdAt: this._formatTimestamp(data.createdAt),
      updatedAt: this._formatTimestamp(data.updatedAt),
    };
  }

  async createRecommendation(data) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const docRef = await collection.add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const snapshot = await docRef.get();
      return this._formatDocument(snapshot);
    });
  }

  async getRecommendationById(id) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.doc(id).get();
      return this._formatDocument(snapshot);
    });
  }

  async getRecommendationsByLessonId(lessonPlanId) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection
        .where('lessonPlanId', '==', lessonPlanId)
        .get();

      return snapshot.docs
        .map((doc) => this._formatDocument(doc))
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
    });
  }

  async updateRecommendation(id, data) {
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
}

export default new RecommendationModel();
