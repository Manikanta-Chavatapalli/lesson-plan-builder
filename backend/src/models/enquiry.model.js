import admin from 'firebase-admin';
import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withFirebaseErrorHandling } from '../utils/firebaseErrorHandler.js';

const { FieldValue } = admin.firestore;

class EnquiryModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.ENQUIRIES);
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
      parentName: data.parentName,
      parentEmail: data.parentEmail,
      studentName: data.studentName,
      studentClass: data.studentClass,
      studentSection: data.studentSection,
      message: data.message,
      teacherEmail: data.teacherEmail,
      roleTarget: data.roleTarget || 'teacher',
      status: data.status || 'new',
      priority: data.priority || 'Medium',
      responseMessage: data.responseMessage || null,
      respondedBy: data.respondedBy || null,
      respondedAt: this._formatTimestamp(data.respondedAt),
      acceptedAt: this._formatTimestamp(data.acceptedAt),
      createdAt: this._formatTimestamp(data.createdAt),
      updatedAt: this._formatTimestamp(data.updatedAt),
    };
  }

  async create(data) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const docRef = await collection.add({
        ...data,
        status: data.status || 'new',
        roleTarget: data.roleTarget || 'teacher',
        priority: data.priority || 'Medium',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const snapshot = await docRef.get();
      return this._formatDocument(snapshot);
    });
  }

  async findAll(_filters = {}) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.orderBy('createdAt', 'desc').limit(100).get();
      return snapshot.docs.map((doc) => this._formatDocument(doc));
    });
  }

  async findById(id) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.doc(id).get();
      return this._formatDocument(snapshot);
    });
  }

  async update(id, data) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const docRef = collection.doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return null;

      await docRef.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      return this._formatDocument(updated);
    });
  }

  async delete(id) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const docRef = collection.doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return null;

      await docRef.delete();
      
      // Clean up orphaned alerts
      try {
        const alertsRef = admin.firestore().collection(COLLECTIONS.ALERTS);
        const alertsSnapshot = await alertsRef.where('recordId', '==', id).get();
        const batch = admin.firestore().batch();
        alertsSnapshot.docs.forEach((alertDoc) => {
          batch.delete(alertDoc.ref);
        });
        await batch.commit();
      } catch (err) {
        console.error(`Failed to cleanup alerts for enquiry ${id}:`, err);
      }
      
      return { id };
    });
  }
}

export default new EnquiryModel();
