import { JobRepository } from '../../data/repositories/job-repository.js';
import { Job } from '../../data/models/job.js';

export class JobForm {
  constructor() {
    this.repo = new JobRepository();
  }

  async openCreate() {
    await this.ensureModal();
    document.getElementById('newJobModal').classList.remove('hidden');
    const btn = document.getElementById('job_save');
    if (btn) {
      btn.onclick = async () => {
        const { showLoading, hideLoading } = await import('../../components/ui/spinner.js');
        const job = new Job({
          title: document.getElementById('job_title').value.trim(),
          department: document.getElementById('job_department').value.trim(),
          positions: Number(document.getElementById('job_positions').value) || 1,
          experience: document.getElementById('job_experience').value.trim(),
          deadline: document.getElementById('job_deadline').value,
          skills: (document.getElementById('job_skills').value||'').split(';').map(s=>s.trim()).filter(Boolean),
          status: '진행중'
        });
        showLoading('등록 중...');
        try { await this.repo.save(job); } catch(e){ console.error(e); alert('등록 중 오류가 발생했습니다.'); } finally { hideLoading(); }
        document.getElementById('newJobModal').classList.add('hidden');
        window.dispatchEvent(new CustomEvent('jobs:updated'));
      };
    }
  }

  async ensureModal() {
    if (!document.getElementById('newJobModal')) {
      const html = await fetch('src/templates/pages/jobs-new-modal.html').then(r=>r.text());
      const holder = document.createElement('div');
      holder.innerHTML = html;
      document.body.appendChild(holder.firstElementChild);
    }
  }
}


