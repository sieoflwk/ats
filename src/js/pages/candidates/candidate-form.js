import { CandidateRepository } from '../../data/repositories/candidate-repository.js';
import { Candidate } from '../../data/models/candidate.js';

export class CandidateForm {
  constructor() {
    this.repo = new CandidateRepository();
  }

  async openCreate() {
    const c = new Candidate({ id: null, name: '', email: '', phone: '', position: '', status: '신규', skills: [] });
    const { CandidateDetail } = await import('./candidate-detail.js');
    const detail = new CandidateDetail();
    detail.open(c);
  }
}


