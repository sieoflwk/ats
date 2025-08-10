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
    if (!this.name || this.name.trim().length < 2) return '이름은 2글자 이상 입력해주세요.';
    if (!this.email) return '이메일은 필수입니다.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) return '이메일 형식이 올바르지 않습니다.';
    if (!this.position) return '지원 직무는 필수입니다.';
    if (this.phone && !/^[\d\-\+\(\)\s]+$/.test(this.phone)) return '전화번호 형식이 올바르지 않습니다.';
    if (this.score < 0 || this.score > 100) return '점수는 0~100 사이여야 합니다.';
    
    // 상태 유효성 검사
    const validStatuses = ['신규', '서류검토', '서류통과', '면접대기', '면접진행', '최종검토', '최종합격', '불합격', '보류'];
    if (!validStatuses.includes(this.status)) return '유효하지 않은 상태입니다.';
    
    return null;
  }

  toJSON() {
    return { ...this };
  }
}


