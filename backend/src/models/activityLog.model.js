import admin from 'firebase-admin';
import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withFirebaseErrorHandling } from '../utils/firebaseErrorHandler.js';

const { FieldValue } = admin.firestore;

class ActivityLogModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.ACTIVITIES);
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
      recordId: data.recordId,
      userId: data.userId,
      type: data.type,
      action: data.action,
      message: data.message,
      priority: data.priority,
      date: this._formatTimestamp(data.date) || data.date,
      createdAt: this._formatTimestamp(data.createdAt),
    };
  }

  async create(data) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const docRef = await collection.add({
        ...data,
        userId: data.userId,
        date: data.date || FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
      const snapshot = await docRef.get();
      return this._formatDocument(snapshot);
    });
  }

  async findAll(userId = null) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      let query = collection;
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      const snapshot = await query.get();
      
      return snapshot.docs
        .map((doc) => this._formatDocument(doc))
        .sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
    });
  }

  async delete(id) {
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
}

export default new ActivityLogModel();
