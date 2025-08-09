export class Job {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.department = data.department || '';
    this.positions = Number.isFinite(data.positions) ? data.positions : 1;
    this.experience = data.experience || '';
    this.deadline = data.deadline || '';
    this.status = data.status || '진행중';
    this.skills = Array.isArray(data.skills) ? data.skills : [];
    this.createdDate = data.createdDate || new Date().toISOString().split('T')[0];
  }

  toJSON() { return { ...this }; }
}


