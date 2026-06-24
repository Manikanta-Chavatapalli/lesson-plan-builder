import firebaseClient from '../utils/firebaseClient.js';
import { AppError } from '../errors/AppError.js';

export class BaseModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this._collectionRef = null;
  }

  get collectionRef() {
    if (!this._collectionRef) {
      this._collectionRef = firebaseClient.getCollection(this.collectionName);
    }
    return this._collectionRef;
  }

  _ensureCollectionRef() {
    const ref = this.collectionRef;

    if (!ref) {
      throw new AppError(
        'Firestore is not initialized. Check Firebase environment configuration.',
        503,
        'FIREBASE_NOT_INITIALIZED'
      );
    }

    return ref;
  }
}

export default BaseModel;
