import { BaseModel } from './base.model.js';
import { COLLECTIONS } from '../constants/collections.js';
import notImplemented from '../utils/notImplemented.js';

class HistoryModel extends BaseModel {
  constructor() {
    super(COLLECTIONS.LESSON_PLAN_HISTORY);
  }

  async create(_data) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.create');
  }

  async findById(_id) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.findById');
  }

  async findAll(_filters = {}) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.findAll');
  }

  async findByLessonId(_lessonId) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.findByLessonId');
  }

  async update(_id, _data) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.update');
  }

  async delete(_id) {
    this._ensureCollectionRef();
    notImplemented('HistoryModel.delete');
  }
}

export default new HistoryModel();
