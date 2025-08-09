export class Candidate {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.position = data.position || '';
    this.status = data.status || '신규';
    this.skills = Array.isArray(data.skills) ? data.skills : [];
    this.appliedDate = data.appliedDate || new Date().toISOString().split('T')[0];
    this.score = Number.isFinite(data.score) ? data.score : 0;
    this.avatar = data.avatar || '👤';
    /** @type {{overall:number,technical:number,communication:number,problemSolving:number,teamwork:number,notes:string}} */
    this.evaluations = data.evaluations || {
      overall: this.score || 0,
      technical: 0,
      communication: 0,
      problemSolving: 0,
      teamwork: 0,
      notes: ''
    };
    /** @type {Array<{date:string, action:string, description:string}>} */
    this.history = Array.isArray(data.history) ? data.history : [];
    /** @type {{name:string,dataUrl:string}|null} */
    this.resume = data.resume || null; // { name, dataUrl }
  }

  validate() {
    if (!this.name) return '이름은 필수입니다.';
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) return '이메일 형식이 올바르지 않습니다.';
    return null;
  }

  toJSON() {
    return { ...this };
  }
}


