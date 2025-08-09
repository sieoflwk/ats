import { StorageService } from './storage-service.js';
import { sampleCandidates } from '../data/fixtures/sample-candidates.js';
import { sampleJobs } from '../data/fixtures/sample-jobs.js';
import { sampleInterviews } from '../data/fixtures/sample-interviews.js';

export class SeedService {
  async seed() {
    const candStore = new StorageService('candidates');
    const jobStore = new StorageService('jobs');
    const intStore = new StorageService('interviews');

    if ((candStore.getAll() || []).length === 0) candStore.setAll(sampleCandidates);
    if ((jobStore.getAll() || []).length === 0) jobStore.setAll(sampleJobs);
    if ((intStore.getAll() || []).length === 0) intStore.setAll(sampleInterviews);
  }
}


