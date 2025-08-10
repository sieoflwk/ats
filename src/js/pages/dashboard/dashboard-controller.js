import { CandidateRepository } from '../../data/repositories/candidate-repository.js';
import './advanced-stats-widget.js';

export default class DashboardController {
  constructor() {
    this.candidateRepo = new CandidateRepository();
  }

  async init() {
    await this.ensureCandidateModalLoaded();
    this.setupQuickActions();
    this.bindEvents();
    // 고급 위젯이 데이터 로딩을 담당하므로 여기서는 별도 렌더를 하지 않습니다
  }

  async ensureCandidateModalLoaded() {
    try {
      const holder = document.querySelector('[data-include="candidate-detail-modal"]');
      if (!holder || holder.children.length > 0) return;
      const res = await fetch('src/templates/pages/candidate-detail-modal.html', { cache: 'no-store' });
      if (res.ok) holder.innerHTML = await res.text();
    } catch (e) {
      console.warn('Candidate detail modal load failed', e);
    }
  }

  setupQuickActions() {
    // 퀵 액션 카드 이벤트 처리
    document.addEventListener('click', (e) => {
      const quickActionCard = e.target.closest('.quick-action-card');
      if (!quickActionCard) return;

      e.preventDefault();
      
      // 시각적 피드백
      quickActionCard.style.transform = 'scale(0.98)';
      setTimeout(() => {
        quickActionCard.style.transform = '';
      }, 150);

      // 액션 처리
      if (quickActionCard.hasAttribute('data-open-candidate-create')) {
        this.handleNewCandidate();
      } else if (quickActionCard.hasAttribute('data-page')) {
        const page = quickActionCard.getAttribute('data-page');
        this.navigateToPage(page);
      } else if (quickActionCard.id === 'exportData') {
        this.handleExportData();
      }
    });

    // 알림 관련 이벤트
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllNotificationsAsRead();
      });
    }

    // 최근 지원자 클릭 이벤트
    document.addEventListener('click', (e) => {
      const activityItem = e.target.closest('[data-candidate-id]');
      if (activityItem) {
        const candidateId = activityItem.getAttribute('data-candidate-id');
        this.showCandidateDetail(candidateId);
      }
    });
  }

  bindEvents() {
    // 기존 새 지원자 버튼
    const newCandidateBtn = document.getElementById('openNewCandidate');
    if (newCandidateBtn) {
      newCandidateBtn.addEventListener('click', () => {
        this.handleNewCandidate();
      });
    }

    // 전역 지원자 상세 핸들러
    window.showCandidateDetail = (candidateId) => {
      this.showCandidateDetail(candidateId);
    };
  }

  handleNewCandidate() {
    // Navigate to candidates page with new candidate modal
    if (window.app && window.app.router) {
      window.app.router.navigate('candidates');
      // Trigger new candidate modal after navigation
      setTimeout(() => {
        const event = new CustomEvent('open-candidate-create');
        document.dispatchEvent(event);
      }, 100);
    }
  }

  navigateToPage(page) {
    if (window.app && window.app.router) {
      window.app.router.navigate(page);
    }
  }

  async handleExportData() {
    try {
      // 로딩 상태 표시
      const exportBtn = document.getElementById('exportData');
      const originalText = exportBtn.querySelector('.quick-action-title').textContent;
      exportBtn.querySelector('.quick-action-title').textContent = '내보내는 중...';
      exportBtn.disabled = true;

      // 데이터 수집
      const candidates = await this.candidateRepo.findAll();
      
      // CSV 생성
      const csvContent = this.generateCSV(candidates);
      
      // 파일 다운로드
      this.downloadCSV(csvContent, 'candidates_export.csv');
      
      // 성공 메시지
      if (window.showToast) {
        window.showToast('데이터를 성공적으로 내보냈습니다.', 'success');
      }

    } catch (error) {
      console.error('Export failed:', error);
      if (window.showToast) {
        window.showToast('데이터 내보내기에 실패했습니다.', 'error');
      }
    } finally {
      // 버튼 상태 복원
      const exportBtn = document.getElementById('exportData');
      if (exportBtn) {
        exportBtn.querySelector('.quick-action-title').textContent = '데이터 내보내기';
        exportBtn.disabled = false;
      }
    }
  }

  generateCSV(candidates) {
    const headers = ['이름', '이메일', '전화번호', '직무', '상태', '지원일', '경력'];
    const rows = candidates.map(candidate => [
      candidate.name || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.position || '',
      candidate.status || '',
      candidate.appliedDate || '',
      candidate.experience || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return '\ufeff' + csvContent; // UTF-8 BOM for Excel compatibility
  }

  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  markAllNotificationsAsRead() {
    const notifications = document.querySelectorAll('.notification-item');
    notifications.forEach(notification => {
      notification.style.opacity = '0.6';
    });

    // 버튼 텍스트 변경
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
      markAllReadBtn.textContent = '읽음 완료';
      markAllReadBtn.disabled = true;
      
      // 3초 후 원래 상태로 복원
      setTimeout(() => {
        markAllReadBtn.textContent = '모두 읽음';
        markAllReadBtn.disabled = false;
        notifications.forEach(notification => {
          notification.style.opacity = '1';
        });
      }, 3000);
    }

    if (window.showToast) {
      window.showToast('모든 알림을 읽음으로 표시했습니다.', 'success');
    }
  }

  async showCandidateDetail(candidateId) {
    try {
      const candidate = await this.candidateRepo.findById(candidateId);
      if (candidate) {
        // Trigger candidate detail modal
        const event = new CustomEvent('show-candidate-detail', { 
          detail: { candidate } 
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to load candidate detail:', error);
    }
  }

  // 대시보드 새로고침
  async refresh() {
    // 고급 통계 위젯도 새로고침
    if (window.dashboardDataManager) {
      await window.dashboardDataManager.updateMetrics();
      await window.dashboardDataManager.updateCharts();
      await window.dashboardDataManager.updateRecentActivity();
    }
  }
}


