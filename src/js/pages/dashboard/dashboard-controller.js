import { CandidateRepository } from '../../data/repositories/candidate-repository.js';

export default class DashboardController {
  constructor() {
    this.candidateRepo = new CandidateRepository();
  }

  async init() {
    await this.loadStats();
    await this.loadRecent();
  }

  async loadStats() {
    const all = await this.candidateRepo.findAll();
    const total = all.length;
    const hired = all.filter(c => ['최종합격','채용완료'].includes(c.status)).length;
    const active = all.filter(c => ['신규','서류통과','면접대기'].includes(c.status)).length;
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
    setText('totalCandidatesCount', total);
    setText('hiredCandidatesCount', hired);
    setText('activeCandidatesCount', active);
    setText('todayInterviewsCount', Math.floor(Math.random() * 10) + 15);
  }

  async loadRecent() {
    const all = await this.candidateRepo.findAll();
    const tbody = document.getElementById('recentCandidatesTable');
    if (!tbody) return;
    if (all.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color: var(--text-secondary);">최근 지원자가 없습니다.</td></tr>';
      return;
    }
    const recent = all
      .slice()
      .sort((a,b) => (b.appliedDate||'').localeCompare(a.appliedDate||''))
      .slice(0,5);
    tbody.innerHTML = recent.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.position}</td>
        <td><span class="status-badge status-${c.status}">${c.status}</span></td>
        <td>${c.appliedDate}</td>
      </tr>
    `).join('');
  }
}


