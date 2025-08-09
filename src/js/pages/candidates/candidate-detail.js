import { CandidateRepository } from '../../data/repositories/candidate-repository.js';
import { Candidate } from '../../data/models/candidate.js';

export class CandidateDetail {
  constructor() {
    this.repo = new CandidateRepository();
    this.currentId = null;
    this.bind();
  }

  bind() {
    const save = document.getElementById('cd_save');
    const del = document.getElementById('cd_delete');
    if (save) save.addEventListener('click', () => this.save());
    if (del) del.addEventListener('click', () => this.remove());
    document.querySelectorAll('.candidate-tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    // 단축키
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('candidateDetailModal')?.classList.contains('hidden')) return;
      if (e.key === 'Escape') document.getElementById('candidateDetailModal').classList.add('hidden');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); this.save(); }
    });
    // 이력서 업로드 프리뷰
    const resume = document.getElementById('cd_resume');
    if (resume) resume.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file).catch(()=>null);
      const box = document.getElementById('cd_resume_preview');
      if (dataUrl && box) {
        box.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div>${file.name}</div><a download="${file.name}" href="${dataUrl}" class="btn btn-sm">다운로드</a></div>`;
        this._pendingResume = { name: file.name, dataUrl };
      }
    });
    // 평가 슬라이더 표시
    ['overall','technical','communication','problemSolving','teamwork'].forEach(k => {
      const input = document.getElementById(`cd_eval_${k}`);
      const disp = document.getElementById(`cd_eval_${k}_display`);
      if (input && disp) input.addEventListener('input', () => { disp.textContent = `${input.value}점`; });
    });
  }

  open(candidate) {
    this.currentId = candidate.id;
    setVal('cd_name', candidate.name);
    setVal('cd_email', candidate.email);
    setVal('cd_phone', candidate.phone);
    setVal('cd_position', candidate.position);
    setVal('cd_status', candidate.status);
    setVal('cd_skills', (candidate.skills||[]).join(';'));
    // 이력서
    const box = document.getElementById('cd_resume_preview');
    if (box) {
      if (candidate.resume?.dataUrl) box.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div>${candidate.resume.name}</div><a download="${candidate.resume.name}" href="${candidate.resume.dataUrl}" class="btn btn-sm">다운로드</a></div>`;
      else box.textContent = '파일을 업로드하면 미리보기/다운로드 링크가 표시됩니다.';
    }
    // 평가값
    const ev = candidate.evaluations || {};
    setRange('cd_eval_overall', ev.overall||0);
    setRange('cd_eval_technical', ev.technical||0);
    setRange('cd_eval_communication', ev.communication||0);
    setRange('cd_eval_problemSolving', ev.problemSolving||0);
    setRange('cd_eval_teamwork', ev.teamwork||0);
    setVal('cd_eval_notes', ev.notes||'');
    // 이력 타임라인
    const list = document.getElementById('cd_history_list');
    if (list) list.innerHTML = (candidate.history||[]).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||'')).map(h => `
      <div style="border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-weight:700;">${h.action}</div>
        <div style="font-size:12px;color:var(--gray-600);">${new Date(h.date).toLocaleString()}</div>
        <div style="margin-top:4px;">${h.description||''}</div>
      </div>
    `).join('');
    document.getElementById('candidateDetailModal').classList.remove('hidden');
  }

  async save() {
    const { showLoading, hideLoading } = await import('../../components/ui/spinner.js');
    const candidate = new Candidate({
      id: this.currentId,
      name: document.getElementById('cd_name').value.trim(),
      email: document.getElementById('cd_email').value.trim(),
      phone: document.getElementById('cd_phone').value.trim(),
      position: document.getElementById('cd_position').value.trim(),
      status: document.getElementById('cd_status').value.trim() || '신규',
      skills: (document.getElementById('cd_skills').value || '').split(';').map(s=>s.trim()).filter(Boolean)
    });
    // 간단 검증
    const { validateEmail, requireFields } = await import('../../utils/validation.js');
    const errs = [ validateEmail(candidate.email), ...requireFields({ 이름: candidate.name, 직무: candidate.position }) ].filter(Boolean);
    if (errs.length) { alert(errs[0]); return; }
    showLoading('저장 중...');
    // 평가 수집
    candidate.evaluations = {
      overall: Number(document.getElementById('cd_eval_overall')?.value||0),
      technical: Number(document.getElementById('cd_eval_technical')?.value||0),
      communication: Number(document.getElementById('cd_eval_communication')?.value||0),
      problemSolving: Number(document.getElementById('cd_eval_problemSolving')?.value||0),
      teamwork: Number(document.getElementById('cd_eval_teamwork')?.value||0),
      notes: document.getElementById('cd_eval_notes')?.value||''
    };
    candidate.score = candidate.evaluations.overall;
    // 이력서 반영
    if (this._pendingResume) candidate.resume = this._pendingResume;
    // 이력 추가
    candidate.history = (await this.repo.findById(candidate.id))?.history || [];
    candidate.history.push({ date: new Date().toISOString(), action: '정보 저장', description: '지원자 정보가 저장되었습니다.' });
    try {
      await this.repo.save(candidate);
    } catch (e) {
      console.error(e); alert('저장 중 오류가 발생했습니다.');
    } finally { hideLoading(); }
    document.getElementById('candidateDetailModal').classList.add('hidden');
    window.dispatchEvent(new CustomEvent('candidates:updated'));
  }

  async remove() {
    if (!this.currentId) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await this.repo.delete(this.currentId);
    document.getElementById('candidateDetailModal').classList.add('hidden');
    window.dispatchEvent(new CustomEvent('candidates:updated'));
  }

  switchTab(key) {
    document.querySelectorAll('.candidate-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    ['basic','resume','evaluation','history'].forEach(k => {
      document.getElementById(`tab_${k}`)?.classList.toggle('hidden', k !== key);
    });
  }
}

function setVal(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function setRange(id, value) { const el = document.getElementById(id); const d = document.getElementById(`${id}_display`); if (el) el.value = value ?? 0; if (d) d.textContent = `${value ?? 0}점`; }
function fileToDataUrl(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }


