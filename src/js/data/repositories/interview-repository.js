import { StorageService } from '../../services/storage-service.js';
import { Interview } from '../models/interview.js';

export class InterviewRepository {
  constructor() {
    this.storage = new StorageService('interviews');
  }
  async findAll() { return this.storage.getAll().map(d => new Interview(d)); }
  async save(interview) {
    const i = interview instanceof Interview ? interview : new Interview(interview);
    if (!i.id) i.id = Date.now();
    this.storage.upsert(i.toJSON());
    return i;
  }
  async delete(id) { this.storage.delete(id); }
}


