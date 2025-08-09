import { StorageService } from '../../services/storage-service.js';
import { Candidate } from '../models/candidate.js';

export class CandidateRepository {
  constructor() {
    this.storage = new StorageService('candidates');
  }

  async findAll() {
    return this.storage.getAll().map((d) => new Candidate(d));
  }

  async findById(id) {
    return (await this.findAll()).find((c) => c.id === id) || null;
  }

  async save(candidate) {
    const c = candidate instanceof Candidate ? candidate : new Candidate(candidate);
    const err = c.validate();
    if (err) throw new Error(err);
    if (!c.id) c.id = Date.now();
    this.storage.upsert(c.toJSON());
    return c;
  }

  async delete(id) {
    this.storage.delete(id);
  }
}


