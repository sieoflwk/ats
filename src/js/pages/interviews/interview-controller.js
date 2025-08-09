import { InterviewRepository } from '../../data/repositories/interview-repository.js';

export default class InterviewController {
  constructor() {
    this.repo = new InterviewRepository();
  }

  async init() {
    await this.render();
    const btn = document.getElementById('openNewInterview');
    if (btn) btn.addEventListener('click', async () => {
      const { InterviewForm } = await import('./interview-form.js');
      (new InterviewForm()).openCreate();
    });
    window.addEventListener('interviews:updated', () => this.render());
    document.getElementById('interviewsTableBody')?.addEventListener('click', async (e) => {
      const row = e.target.closest('tr'); if (!row) return;
      const id = Number(row.getAttribute('data-id'));
      const item = (await this.repo.findAll()).find(x => x.id === id);
      if (!item) return;
      const { InterviewForm } = await import('./interview-form.js');
      const form = new InterviewForm();
      await form.openEdit(item);
    });
  }

  async render() {
    const tbody = document.getElementById('interviewsTableBody');
    if (!tbody) return;
    const interviews = await this.repo.findAll();
    if (interviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color: var(--text-secondary);">등록된 일정이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = interviews.map(i => `
      <tr data-id="${i.id}" style="cursor:pointer;">
        <td>${i.candidateName}</td>
        <td>${i.position}</td>
        <td>${i.type}</td>
        <td>${i.date} ${i.time} (${i.duration}분)</td>
        <td><span class="status-badge status-${i.status}">${i.status}</span></td>
      </tr>
    `).join('');
  }
}


