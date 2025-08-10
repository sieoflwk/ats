/**
 * 간소화된 App 클래스
 * 핵심 기능만 포함하여 효율성 증대
 */

import { Router } from './router.js';
import { AuthService } from '../services/auth-service.js';
import { EventBus } from './event-bus.js';
import { SeedService } from '../services/seed-service.js';
import { showToast, storage, spinner } from '../utils/common.js';

export class App {
  constructor() {
    this.router = new Router();
    this.authService = new AuthService();
    this.eventBus = new EventBus();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('App already initialized');
      return;
    }

    console.log('🚀 Starting WorkFlow ATS');
    spinner.show('시스템을 초기화하는 중...');

    try {
      // 인증 확인
      await this.checkAuthentication();
      
      // 시드 데이터 설정
      await this.setupSeedData();
      
      // 테마 초기화
      this.initializeTheme();
      
      // 공통 UI 로딩
      await this.loadCommonUI();
      
      // 라우팅 설정
      this.setupRouting();
      
      // UI 이벤트 바인딩
      this.bindGlobalUiHandlers();
      
      this.isInitialized = true;
      spinner.hide();
      console.log('✅ WorkFlow ATS initialized successfully!');
      
    } catch (error) {
      spinner.hide();
      console.error('❌ App initialization failed:', error);
      showToast('앱 초기화 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
      this.router.showErrorMessage('앱 초기화 중 오류가 발생했습니다.');
    }
  }

  async checkAuthentication() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = './login.html';
      return;
    }
    console.log('✅ Authentication check completed');
  }

  async setupSeedData() {
    try {
      const seeder = new SeedService();
      await seeder.seed();
      console.log('✅ Seed data setup completed');
    } catch (error) {
      console.warn('⚠️ Seed data setup failed:', error);
    }
  }

  initializeTheme() {
    try {
      const savedTheme = storage.get('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', initialTheme);
      console.log('✅ Theme initialized:', initialTheme);
    } catch (error) {
      console.warn('⚠️ Theme initialization failed:', error);
    }
  }

  async loadCommonUI() {
    await Promise.all([
      this.router.loadComponent('header.html', '#header'),
      this.router.loadComponent('sidebar.html', '#sidebar')
    ]);
    console.log('✅ Common UI loaded');
  }

  setupRouting() {
    this.router.setupHistoryHandling();
    
    // 첫 페이지 로드
    const page = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
    this.router.loadPage(page);
    
    // 해시 변경 감지
    window.addEventListener('hashchange', async () => {
      const target = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
      await this.router.loadPage(target);
    });
    
    console.log('✅ Routing setup completed');
  }

  bindGlobalUiHandlers() {
    // 전역 클릭 이벤트 (이벤트 위임)
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-page]');
      if (target) {
        e.preventDefault();
        const pageName = target.getAttribute('data-page');
        
        // 특별한 액션 처리
        if (target.hasAttribute('data-open-candidate-create')) {
          storage.set('openCandidateCreate', 'true');
        }
        
        await this.router.loadPage(pageName);
      }

      // 로그아웃 버튼
      if (e.target.matches('.logout-btn, [data-action="logout"]')) {
        this.handleLogout();
      }

      // 테마 토글
      if (e.target.matches('.theme-toggle, [data-action="theme-toggle"]')) {
        this.toggleTheme();
      }
    });

    // 전역 키보드 이벤트
    document.addEventListener('keydown', (e) => {
      // ESC 키로 모달 닫기
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal.active, .modal.show');
        if (modal) {
          modal.classList.remove('active', 'show');
        }
      }
    });

    console.log('✅ Global UI handlers bound');

    // 전역 함수로 노출하여 정적 템플릿에서 사용 가능하도록 함
    window.logout = () => this.handleLogout();
    window.toggleProfileMenu = (event) => {
      event?.stopPropagation();
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.toggle('hidden');
    };
  }

  handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      this.authService.logout();
      showToast('로그아웃되었습니다.', 'success');
      setTimeout(() => {
        window.location.href = './login.html';
      }, 1000);
    }
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    storage.set('theme', newTheme);
    
    showToast(`${newTheme === 'light' ? '라이트' : '다크'} 테마로 변경되었습니다.`, 'info');
  }

  // 성능 모니터링 (간소화)
  setupPerformanceMonitoring() {
    if (typeof window.performance !== 'undefined') {
      // 페이지 로드 시간 측정
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`📊 Page load time: ${Math.round(loadTime)}ms`);
      });

      // 메모리 사용량 모니터링 (개발 환경에서만)
      if (location.hostname === 'localhost' && window.performance.memory) {
        setInterval(() => {
          const memory = window.performance.memory;
          const used = Math.round(memory.usedJSHeapSize / 1048576);
          const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
          console.log(`🧠 Memory: ${used}MB / ${limit}MB`);
        }, 30000); // 30초마다
      }
    }
  }

  // 정리 함수
  cleanup() {
    if (this.router) {
      this.router.cleanup();
    }
    
    // 이벤트 리스너 정리
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    
    console.log('✅ App cleanup completed');
  }

  // 앱 재시작
  async restart() {
    this.cleanup();
    this.isInitialized = false;
    await this.initialize();
  }
}
