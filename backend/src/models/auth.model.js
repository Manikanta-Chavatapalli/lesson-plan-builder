import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withFirebaseErrorHandling } from '../utils/firebaseErrorHandler.js';

const { FieldValue } = admin.firestore;

class AuthModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  _formatTimestamp(timestamp) {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    return timestamp;
  }

  _formatUser(doc) {
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: this._formatTimestamp(data.createdAt),
    };
  }

  async createUser({ name, email, passwordHash, role = 'teacher' }) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const docRef = await collection.add({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        createdAt: FieldValue.serverTimestamp(),
      });

      const snapshot = await docRef.get();
      return this._formatUser(snapshot);
    });
  }

  async findByEmail(email) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { ...this._formatUser(doc), passwordHash: doc.data().passwordHash };
    });
  }

  async findById(id) {
    const collection = this._ensureCollectionRef();

    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.doc(id).get();
      return this._formatUser(snapshot);
    });
  }

  async deleteUser(id) {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      await collection.doc(id).delete();
      return true;
    });
  }

  async findAll() {
    const collection = this._ensureCollectionRef();
    return withFirebaseErrorHandling(async () => {
      const snapshot = await collection.get();
      return snapshot.docs.map(doc => this._formatUser(doc));
    });
  }
}

export { bcrypt };
export default new AuthModel();
