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
    this.description = data.description || '';
    this.requirements = data.requirements || '';
    this.benefits = data.benefits || '';
    this.location = data.location || '';
    this.employmentType = data.employmentType || '정규직';
    this.salary = data.salary || '';
  }

  validate() {
    if (!this.title) return '채용공고 제목은 필수입니다.';
    if (!this.department) return '부서명은 필수입니다.';
    if (this.positions < 1) return '채용인원은 1명 이상이어야 합니다.';
    if (this.deadline && new Date(this.deadline) < new Date()) return '마감일은 현재 날짜 이후여야 합니다.';
    return null;
  }

  toJSON() { return { ...this }; }
}


