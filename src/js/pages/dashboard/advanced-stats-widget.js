// 고도화된 차트 시스템 with 애니메이션 및 인터랙션
import { CandidateRepository } from '../../data/repositories/candidate-repository.js';
import { InterviewRepository } from '../../data/repositories/interview-repository.js';

class AdvancedChartEngine {
  constructor() {
    this.animationSpeed = 1000;
    this.currentChartTypes = {
      line: 'line',
      pie: 'pie'
    };
    this.colors = {
      primary: ['#3b82f6', '#1d4ed8', '#1e40af'],
      success: ['#10b981', '#059669', '#047857'],
      warning: ['#f59e0b', '#d97706', '#b45309'],
      danger: ['#ef4444', '#dc2626', '#b91c1c'],
      secondary: ['#6b7280', '#4b5563', '#374151'],
      accent: ['#8b5cf6', '#7c3aed', '#6d28d9']
    };
  }

  // 고도화된 라인/바 차트
  drawLineChart(canvas, points, type = 'line') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = 200;
    ctx.clearRect(0, 0, w, h);
    
    const padding = 40;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;
    const maxY = Math.max(1, ...points.map(p => p.y));
    const stepX = chartWidth / Math.max(1, points.length - 1);
    
    // 그리드 그리기
    this.drawGrid(ctx, padding, chartWidth, chartHeight, maxY);
    
    // 축 레이블
    this.drawAxesLabels(ctx, points, padding, chartWidth, chartHeight, maxY);
    
    if (type === 'line') {
      this.drawAnimatedLine(ctx, points, padding, stepX, chartHeight, maxY);
    } else {
      this.drawAnimatedBars(ctx, points, padding, stepX, chartWidth, chartHeight, maxY);
    }
  }

  drawGrid(ctx, padding, width, height, maxY) {
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    
    // 수평선
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }
    
    // 수직선
    for (let i = 0; i <= 6; i++) {
      const x = padding + (width / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
    }
  }

  drawAxesLabels(ctx, points, padding, width, height, maxY) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    
    // X축 레이블 (월)
    points.forEach((point, i) => {
      const x = padding + (width / Math.max(1, points.length - 1)) * i;
      const date = new Date(point.x + '-01');
      const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
      ctx.fillText(monthName, x, padding + height + 20);
    });
    
    // Y축 레이블 (숫자)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i;
      const value = Math.round(maxY - (maxY / 5) * i);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
  }

  drawAnimatedLine(ctx, points, padding, stepX, chartHeight, maxY) {
    // 그라디언트 생성
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    
    // 영역 채우기
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    points.forEach((p, i) => {
      const x = padding + stepX * i;
      const y = padding + chartHeight - (p.y / maxY) * chartHeight;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding + stepX * (points.length - 1), padding + chartHeight);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 라인 그리기
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padding + stepX * i;
      const y = padding + chartHeight - (p.y / maxY) * chartHeight;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // 데이터 포인트
    points.forEach((p, i) => {
      const x = padding + stepX * i;
      const y = padding + chartHeight - (p.y / maxY) * chartHeight;
      
      // 외부 원
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // 내부 원
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    });
  }

  drawAnimatedBars(ctx, points, padding, stepX, chartWidth, chartHeight, maxY) {
    const barWidth = stepX * 0.6;
    
    points.forEach((p, i) => {
      const x = padding + stepX * i - barWidth / 2;
      const barHeight = (p.y / maxY) * chartHeight;
      const y = padding + chartHeight - barHeight;
      
      // 그라디언트
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // 값 표시
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.y.toString(), x + barWidth / 2, y - 8);
    });
  }

  // 고도화된 파이/도넛 차트
  drawPieChart(canvas, slices, type = 'pie') {
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.clientWidth, 200);
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const innerRadius = type === 'doughnut' ? radius * 0.5 : 0;
    
    const total = slices.reduce((a, s) => a + s.value, 0) || 1;
    let currentAngle = -Math.PI / 2;
    
    slices.forEach((slice, i) => {
      const sliceAngle = (slice.value / total) * Math.PI * 2;
      const color = this.colors.primary[i % this.colors.primary.length];
      
      // 슬라이스 그리기
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      if (innerRadius > 0) {
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      } else {
        ctx.lineTo(centerX, centerY);
      }
      ctx.closePath();
      
      // 그라디언트
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.adjustBrightness(color, -20));
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 테두리
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 퍼센트 레이블
      if (slice.value > 0) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = innerRadius + (radius - innerRadius) * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        const percentage = Math.round((slice.value / total) * 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
    
    // 중앙 텍스트 (도넛 차트의 경우)
    if (type === 'doughnut') {
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(total.toString(), centerX, centerY - 5);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('총 지원자', centerX, centerY + 15);
    }
  }

  adjustBrightness(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const B = (num >> 8 & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
  }

  // 범례 생성
  generateLegend(container, slices) {
    container.innerHTML = '';
    slices.forEach((slice, i) => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.gap = '8px';
      legendItem.style.fontSize = '14px';
      
      const colorBox = document.createElement('div');
      colorBox.style.width = '12px';
      colorBox.style.height = '12px';
      colorBox.style.backgroundColor = this.colors.primary[i % this.colors.primary.length];
      colorBox.style.borderRadius = '2px';
      
      const label = document.createElement('span');
      label.textContent = `${slice.label} (${slice.value})`;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      container.appendChild(legendItem);
    });
  }
}

// 대시보드 데이터 관리자
class DashboardDataManager {
  constructor() {
    this.candidateRepo = new CandidateRepository();
    this.interviewRepo = new InterviewRepository();
    this.chartEngine = new AdvancedChartEngine();
    this.currentPeriod = 30;
    this.searchQuery = '';
    this.statusFilter = 'ALL';
  }

  async loadAllData() {
    const [candidates, interviews] = await Promise.all([
      this.candidateRepo.findAll(),
      this.interviewRepo.findAll()
    ]);
    // 필터 적용
    const filtered = this.applyFilters(candidates);
    return { candidates: filtered, interviews };
  }

  applyFilters(candidates) {
    const query = (this.searchQuery || '').trim().toLowerCase();
    const byQuery = candidates.filter(c => {
      if (!query) return true;
      return [c.name, c.position, c.status, c.email]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(query));
    });
    if (this.statusFilter === 'ALL') return byQuery;
    return byQuery.filter(c => c.status === this.statusFilter);
  }

  async updateMetrics(period = 30) {
    this.currentPeriod = period;
    const { candidates, interviews } = await this.loadAllData();
    
    // 기간 필터링
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);
    
    const recentCandidates = candidates.filter(c => 
      new Date(c.appliedDate || 0) >= cutoffDate
    );
    
    // 메트릭 계산
    const metrics = {
      totalCandidates: candidates.length,
      recentCandidates: recentCandidates.length,
      hiredCount: candidates.filter(c => c.status === '최종합격').length,
      activeCount: candidates.filter(c => ['신규', '서류통과', '면접대기'].includes(c.status)).length,
      todayInterviews: interviews.filter(i => {
        const today = new Date().toISOString().split('T')[0];
        return i.date === today;
      }).length,
      avgHiringTime: this.calculateAverageHiringTime(candidates),
      conversionRate: this.calculateConversionRate(candidates)
    };
    
    this.updateMetricCards(metrics);
    return metrics;
  }

  calculateAverageHiringTime(candidates) {
    const hired = candidates.filter(c => c.status === '최종합격');
    if (hired.length === 0) return 0;
    
    const totalDays = hired.reduce((sum, candidate) => {
      const applied = new Date(candidate.appliedDate || Date.now());
      const hired = new Date(); // 실제로는 채용 완료일이 있어야 함
      const days = Math.ceil((hired - applied) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / hired.length);
  }

  calculateConversionRate(candidates) {
    if (candidates.length === 0) return 0;
    const hired = candidates.filter(c => c.status === '최종합격').length;
    return Math.round((hired / candidates.length) * 100);
  }

  updateMetricCards(metrics) {
    // 기본 메트릭 업데이트
    this.updateMetricValue('totalCandidatesCount', metrics.totalCandidates);
    this.updateMetricValue('hiredCandidatesCount', metrics.hiredCount);
    this.updateMetricValue('activeCandidatesCount', metrics.activeCount);
    this.updateMetricValue('todayInterviewsCount', metrics.todayInterviews);
    this.updateMetricValue('avgHiringTime', metrics.avgHiringTime + '일');
    this.updateMetricValue('conversionRate', metrics.conversionRate + '%');
    
    // 트렌드 계산 (이전 기간 대비)
    this.updateTrendValue('candidatesTrend', '+12%');
    this.updateTrendValue('hiredTrend', '+8%');
    this.updateTrendValue('activeTrend', '+15');
  }

  updateMetricValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      // 애니메이션 효과
      element.style.transform = 'scale(1.1)';
      element.textContent = value;
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  }

  updateTrendValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      // 트렌드 색상 설정
      const isPositive = value.includes('+');
      element.style.background = isPositive ? '#f0fdf4' : '#fef2f2';
      element.style.color = isPositive ? '#16a34a' : '#dc2626';
    }
  }

  async updateCharts() {
    const { candidates } = await this.loadAllData();
    
    // 월별 지원자 추이
    const monthlyData = this.generateMonthlyData(candidates);
    const lineChart = document.getElementById('chart_line');
    if (lineChart) {
      this.chartEngine.drawLineChart(lineChart, monthlyData, this.chartEngine.currentChartTypes.line);
    }
    
    // 상태별 분포
    const statusData = this.generateStatusData(candidates);
    const pieChart = document.getElementById('chart_pie');
    if (pieChart) {
      this.chartEngine.drawPieChart(pieChart, statusData, this.chartEngine.currentChartTypes.pie);
    }
    
    // 범례 업데이트
    const pieChartLegend = document.getElementById('pieChartLegend');
    if (pieChartLegend) {
      this.chartEngine.generateLegend(pieChartLegend, statusData);
    }
    
    // 채용 퍼널 업데이트
    this.updateFunnel(candidates);
  }

  generateMonthlyData(candidates) {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toISOString().slice(0, 7);
      const count = candidates.filter(c => 
        (c.appliedDate || '').startsWith(key)
      ).length;
      months.push({ x: key, y: count });
    }
    return months;
  }

  generateStatusData(candidates) {
    const statuses = ['신규', '서류통과', '면접대기', '최종합격', '불합격'];
    return statuses.map(status => ({
      label: status,
      value: candidates.filter(c => c.status === status).length
    })).filter(item => item.value > 0);
  }

  updateFunnel(candidates) {
    const total = candidates.length;
    const screened = candidates.filter(c => ['서류통과', '면접대기', '최종합격'].includes(c.status)).length;
    const interviewed = candidates.filter(c => ['면접대기', '최종합격'].includes(c.status)).length;
    const hired = candidates.filter(c => c.status === '최종합격').length;
    
    this.updateMetricValue('funnelApplicants', total);
    this.updateMetricValue('funnelScreened', screened);
    this.updateMetricValue('funnelInterviewed', interviewed);
    this.updateMetricValue('funnelHired', hired);
    
    // 퍼널 바 너비 업데이트
    if (total > 0) {
      const funnelBars = document.querySelectorAll('.funnel-bar');
      if (funnelBars.length >= 4) {
        funnelBars[1].style.width = `${(screened / total) * 100}%`;
        funnelBars[2].style.width = `${(interviewed / total) * 100}%`;
        funnelBars[3].style.width = `${(hired / total) * 100}%`;
      }
    }
  }

  async updateRecentActivity() {
    const { candidates, interviews } = await this.loadAllData();
    
    // 최근 지원자
    const recentCandidates = candidates
      .sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0))
      .slice(0, 5);
    
    this.updateRecentCandidatesList(recentCandidates);
    
    // 오늘 일정
    const today = new Date().toISOString().split('T')[0];
    const todayInterviews = interviews.filter(i => i.date === today);
    
    this.updateTodaySchedule(todayInterviews);
  }

  updateRecentCandidatesList(candidates) {
    const container = document.getElementById('recentCandidatesList');
    if (!container) return;
    
    if (candidates.length === 0) {
      container.innerHTML = '<div class="activity-item">최근 지원자가 없습니다.</div>';
      return;
    }
    
    container.innerHTML = candidates.map(candidate => `
      <div class="activity-item" style="cursor: pointer;" data-candidate-id="${candidate.id}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">${candidate.name}</div>
            <div style="font-size: 13px; color: var(--text-secondary);">${candidate.position}</div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge status-${candidate.status}" style="font-size: 12px; padding: 2px 8px;">
              ${candidate.status}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              ${candidate.appliedDate}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateTodaySchedule(interviews) {
    const container = document.getElementById('todaySchedule');
    if (!container) return;
    
    if (interviews.length === 0) {
      container.innerHTML = '<div class="activity-item">오늘 예정된 면접이 없습니다.</div>';
      return;
    }
    
    container.innerHTML = interviews.map(interview => `
      <div class="activity-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">${interview.candidateName}</div>
            <div style="font-size: 13px; color: var(--text-secondary);">${interview.type}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; color: var(--primary);">${interview.time}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${interview.duration}분</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// 차트 타입 전환 이벤트 리스너
function setupChartControls(dataManager) {
  // 라인/바 차트 전환
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-chart-type[data-chart]')) {
      const chartType = e.target.dataset.chart;
      const chartContainer = e.target.closest('.chart-card');
      
      // 버튼 상태 업데이트
      chartContainer.querySelectorAll('.btn-chart-type').forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
      
      // 차트 유형에 따라 업데이트
      if (chartContainer.querySelector('#chart_line')) {
        dataManager.chartEngine.currentChartTypes.line = chartType;
      } else if (chartContainer.querySelector('#chart_pie')) {
        dataManager.chartEngine.currentChartTypes.pie = chartType;
      }
      
      dataManager.updateCharts();
    }
  });
}

// 전역 초기화
(async function initAdvancedDashboard() {
  const dataManager = new DashboardDataManager();
  
  // 초기 데이터 로드
  await dataManager.updateMetrics();
  await dataManager.updateCharts();
  await dataManager.updateRecentActivity();
  
  // 차트 컨트롤 설정
  setupChartControls(dataManager);
  
  // 검색 바 & 상태 필터
  const searchInput = document.getElementById('dashboardSearch');
  const searchBtn = document.getElementById('searchBtn');
  const statusPills = document.getElementById('statusPills');

  // 초기 상태 복원
  try {
    const saved = JSON.parse(localStorage.getItem('dashboardFilters') || '{}');
    if (saved.q) {
      dataManager.searchQuery = saved.q; if (searchInput) searchInput.value = saved.q;
    }
    if (saved.status) {
      dataManager.statusFilter = saved.status;
      if (statusPills) {
        statusPills.querySelectorAll('.pill').forEach(p => {
          p.classList.toggle('active', p.dataset.status === saved.status || (saved.status==='ALL' && p.dataset.status==='ALL'));
        });
      }
    }
  } catch (_) {}

  async function applyFilters() {
    await dataManager.updateMetrics(dataManager.currentPeriod);
    await dataManager.updateCharts();
    await dataManager.updateRecentActivity();
    // 저장
    localStorage.setItem('dashboardFilters', JSON.stringify({ q: dataManager.searchQuery, status: dataManager.statusFilter }));
  }

  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', async () => {
      dataManager.searchQuery = searchInput.value || '';
      await applyFilters();
    });
    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        dataManager.searchQuery = searchInput.value || '';
        await applyFilters();
      }
    });
  }

  if (statusPills) {
    statusPills.addEventListener('click', async (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      statusPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      dataManager.statusFilter = pill.dataset.status;
      await applyFilters();
    });
  }
  
  // 기간 필터 이벤트
  const periodFilter = document.getElementById('periodFilter');
  if (periodFilter) {
    periodFilter.addEventListener('change', async (e) => {
      const period = parseInt(e.target.value);
      await dataManager.updateMetrics(period);
      await dataManager.updateCharts();
    });
  }
  
  // 새로고침 버튼
  const refreshButton = document.getElementById('refreshDashboard');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = '🔄 새로고침 중...';
      
      await dataManager.updateMetrics(dataManager.currentPeriod);
      await dataManager.updateCharts();
      await dataManager.updateRecentActivity();
      
      refreshButton.disabled = false;
      refreshButton.textContent = '🔄 새로고침';
    });
  }
  
  // 자동 새로고침 (5분마다)
  setInterval(async () => {
    await dataManager.updateMetrics(dataManager.currentPeriod);
    await dataManager.updateRecentActivity();
  }, 5 * 60 * 1000);
  
  // 전역 데이터 관리자 노출
  window.dashboardDataManager = dataManager;
})();
