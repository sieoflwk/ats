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
    this.meetingLink = data.meetingLink || '';
    this.feedback = data.feedback || '';
    this.score = Number.isFinite(data.score) ? data.score : 0;
  }

  validate() {
    if (!this.candidateId) return '지원자를 선택해주세요.';
    if (!this.candidateName) return '지원자 이름은 필수입니다.';
    if (!this.date) return '면접 날짜는 필수입니다.';
    if (!this.time) return '면접 시간은 필수입니다.';
    if (!this.interviewer) return '면접관은 필수입니다.';
    if (this.duration < 15 || this.duration > 480) return '면접 시간은 15분에서 8시간 사이여야 합니다.';
    
    // 과거 날짜 체크
    const interviewDateTime = new Date(`${this.date}T${this.time}`);
    if (interviewDateTime < new Date() && this.status === '예정') {
      return '과거 날짜로 면접을 예정할 수 없습니다.';
    }
    
    return null;
  }

  toJSON() { return { ...this }; }
}


