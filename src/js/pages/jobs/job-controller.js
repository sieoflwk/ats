import { JobRepository } from '../../data/repositories/job-repository.js';

export default class JobController {
  constructor() {
    this.repo = new JobRepository();
  }

  async init() {
    await this.render();
    const btn = document.getElementById('openNewJob');
    if (btn) btn.addEventListener('click', async () => {
      const { JobForm } = await import('./job-form.js');
      (new JobForm()).openCreate();
    });
    window.addEventListener('jobs:updated', () => this.render());
    document.getElementById('jobsTableBody')?.addEventListener('click', async (e) => {
      const row = e.target.closest('tr'); if (!row) return;
      // 상세 편집은 다음 단계에서 링크
    });
  }

  async render() {
    const tbody = document.getElementById('jobsTableBody');
    if (!tbody) return;
    const jobs = await this.repo.findAll();
    if (jobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color: var(--text-secondary);">등록된 공고가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = jobs.map(j => `
      <tr>
        <td>${j.title}</td>
        <td>${j.department}</td>
        <td>${j.experience}</td>
        <td>${j.deadline}</td>
        <td><span class="status-badge status-${j.status}">${j.status}</span></td>
      </tr>
    `).join('');
  }
}


