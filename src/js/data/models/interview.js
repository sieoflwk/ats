export class Interview {
  constructor(data = {}) {
    this.id = data.id || null;
    this.candidateId = data.candidateId || null;
    this.candidateName = data.candidateName || '';
    this.position = data.position || '';
    this.type = data.type || '1차면접';
    this.date = data.date || '';
    this.time = data.time || '';
    this.duration = Number.isFinite(data.duration) ? data.duration : 60;
    this.interviewer = data.interviewer || '';
    this.location = data.location || '';
    this.status = data.status || '예정';
    this.notes = data.notes || '';
  }

  toJSON() { return { ...this }; }
}


