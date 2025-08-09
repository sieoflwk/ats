import { StorageService } from '../../services/storage-service.js';
import { Job } from '../models/job.js';

export class JobRepository {
  constructor() {
    this.storage = new StorageService('jobs');
  }

  async findAll() { return this.storage.getAll().map(d => new Job(d)); }
  async save(job) {
    const j = job instanceof Job ? job : new Job(job);
    if (!j.id) j.id = Date.now();
    this.storage.upsert(j.toJSON());
    return j;
  }
  async delete(id) { this.storage.delete(id); }
}


