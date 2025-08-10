import { CandidateRepository } from '../../data/repositories/candidate-repository.js';
import { Candidate } from '../../data/models/candidate.js';

export default class CandidateController {
  constructor() {
    this.repo = new CandidateRepository();
    this.filtered = [];
  }

  async init() {
    await this.loadModalTemplate();
    this.bind();
    await this.render();
    window.addEventListener('candidates:updated', async () => {
      await this.render((document.getElementById('candidateSearch')?.value)||'');
    });

    // 대시보드에서 새 지원자 의도 전달 시 생성 모달 열기
    try {
      const flag = sessionStorage.getItem('openCandidateCreate');
      if (flag === '1') {
        sessionStorage.removeItem('openCandidateCreate');
        const { CandidateForm } = await import('./candidate-form.js');
        (new CandidateForm()).openCreate();
      }
    } catch (_) {}
  }

  bind() {
    const search = document.getElementById('candidateSearch');
    if (search) {
      search.addEventListener('input', async (e) => {
        await this.render(e.target.value || '');
      });
    }
    const btn = document.getElementById('openNewCandidate');
    if (btn) btn.addEventListener('click', async () => {
      const { CandidateForm } = await import('./candidate-form.js');
      (new CandidateForm()).openCreate();
    });
  }

  async render(keyword = '') {
    const all = await this.repo.findAll();
    const kw = keyword.trim().toLowerCase();
    this.filtered = !kw ? all : all.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      (c.email||'').toLowerCase().includes(kw) ||
      (c.skills||[]).some(s => (s||'').toLowerCase().includes(kw))
    );
    const tbody = document.getElementById('candidatesTableBody');
    if (!tbody) return;
    if (this.filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color: var(--text-secondary);">지원자가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = this.filtered.map(c => `
      <tr data-id="${c.id}" class="candidate-row" style="cursor:pointer;">
        <td>${c.name}</td>
        <td>${c.position}</td>
        <td><span class="status-badge status-${c.status}">${c.status}</span></td>
        <td>${c.appliedDate}</td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.candidate-row').forEach(row => {
      row.addEventListener('click', async () => {
        const id = Number(row.getAttribute('data-id'));
        const cand = (await this.repo.findAll()).find(x => x.id === id);
        if (!cand) return;
        const { CandidateDetail } = await import('./candidate-detail.js');
        const detail = new CandidateDetail();
        detail.open(cand);
      });
    });
  }

  async loadModalTemplate() {
    const holderId = 'candidate-modal-holder';
    if (!document.getElementById(holderId)) {
      const holder = document.createElement('div');
      holder.id = holderId;
      document.body.appendChild(holder);
    }
    const html = await fetch('src/templates/pages/candidate-detail-modal.html').then(r=>r.text()).catch(()=>null);
    if (html) document.getElementById(holderId).innerHTML = html;
  }
}


