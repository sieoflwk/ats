import { InterviewRepository } from '../../data/repositories/interview-repository.js';
import { Interview } from '../../data/models/interview.js';

export class InterviewForm {
  constructor() {
    this.repo = new InterviewRepository();
  }
  async openCreate() {
    await this.ensureModal();
    document.getElementById('newInterviewModal').classList.remove('hidden');
    const btn = document.getElementById('iv_save');
    if (btn) btn.onclick = async () => {
      const { showLoading, hideLoading } = await import('../../components/ui/spinner.js');
      const iv = new Interview({
        candidateName: document.getElementById('iv_candidateName').value.trim(),
        position: document.getElementById('iv_position').value.trim(),
        type: document.getElementById('iv_type').value.trim(),
        date: document.getElementById('iv_date').value,
        time: document.getElementById('iv_time').value,
        duration: Number(document.getElementById('iv_duration').value) || 60,
        interviewer: document.getElementById('iv_interviewer').value.trim(),
        location: document.getElementById('iv_location').value.trim(),
        status: '예정'
      });
      showLoading('등록 중...');
      try { await this.repo.save(iv); } catch(e){ console.error(e); alert('등록 중 오류가 발생했습니다.'); } finally { hideLoading(); }
      document.getElementById('newInterviewModal').classList.add('hidden');
      window.dispatchEvent(new CustomEvent('interviews:updated'));
    };
  }
  async ensureModal() {
    if (!document.getElementById('newInterviewModal')) {
      const html = await fetch('src/templates/pages/interview-new-modal.html').then(r=>r.text());
      const holder = document.createElement('div');
      holder.innerHTML = html;
      document.body.appendChild(holder.firstElementChild);
    }
  }
  async openEdit(item) {
    await this.ensureModal();
    const m = document.getElementById('newInterviewModal');
    if (!m) return;
    m.classList.remove('hidden');
    // 값 채우기
    setVal('iv_candidateName', item.candidateName);
    setVal('iv_position', item.position);
    setVal('iv_type', item.type);
    setVal('iv_date', item.date);
    setVal('iv_time', item.time);
    setVal('iv_duration', item.duration);
    setVal('iv_interviewer', item.interviewer);
    setVal('iv_location', item.location);
    const btn = document.getElementById('iv_save');
    if (btn) btn.onclick = async () => {
      const { showLoading, hideLoading } = await import('../../components/ui/spinner.js');
      Object.assign(item, {
        candidateName: getVal('iv_candidateName'), position: getVal('iv_position'), type: getVal('iv_type'),
        date: getVal('iv_date'), time: getVal('iv_time'), duration: Number(getVal('iv_duration'))||60,
        interviewer: getVal('iv_interviewer'), location: getVal('iv_location')
      });
      showLoading('저장 중...');
      try { await this.repo.save(item); } catch(e){ console.error(e); alert('저장 중 오류가 발생했습니다.'); } finally { hideLoading(); }
      m.classList.add('hidden');
      window.dispatchEvent(new CustomEvent('interviews:updated'));
    };
  }
}
function setVal(id,v){ const el=document.getElementById(id); if(el) el.value=v??''; }
function getVal(id){ return document.getElementById(id)?.value?.trim()||''; }


