// Core modules
import { Router } from './router.js';
import { AuthService } from '../services/auth-service.js';
import { EventBus } from './event-bus.js';
import { SeedService } from '../services/seed-service.js';

// Enhanced libraries
import EventEmitter from '../lib/core/event-emitter.js';
import StateManager from '../lib/core/state-manager.js';
import { getLogger } from '../lib/core/logger.js';
import { getErrorHandler } from '../lib/error/error-handler.js';
import { getLazyLoader } from '../lib/performance/lazy-loader.js';

// Utilities
import { initializeAccessibility } from '../utils/accessibility.js';
import { enforceHTTPS, setupCSP } from '../utils/security.js';
import { createI18n } from '../utils/i18n.js';

export class App {
  constructor() {
    // Core services
    this.router = new Router();
    this.authService = new AuthService();
    this.eventBus = new EventBus();
    
    // Enhanced services
    this.events = new EventEmitter();
    this.state = new StateManager();
    this.logger = getLogger({ level: 'info', console: true });
    this.errorHandler = getErrorHandler({ capture: true, showUserError: true });
    this.lazyLoader = getLazyLoader();
    this.i18n = null;
    
    // State
    this.isInitialized = false;
    this.performance = null;
    this.accessibility = null;
  }

  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('App already initialized');
      return;
    }

    this.logger.info('🚀 Starting WorkFlow ATS v2.0.0');

    try {
      // 보안 설정
      await this.setupSecurity();
      
      // 국제화 초기화
      await this.setupI18n();
      
      // 접근성 초기화
      await this.setupAccessibility();
      
      // 성능 모니터링
      await this.setupPerformanceMonitoring();
      
      // 상태 관리 초기화
      await this.setupStateManagement();
      
      // 지연 로딩 설정
      await this.setupLazyLoading();
      
      // 라우터 초기화
      await this.setupRouter();

      // 인증 확인
      await this.checkAuthentication();

      // 초기 샘플 데이터 주입(최초 1회)
      await this.setupSeedData();

      // 테마 초기화 (저장값 또는 시스템 선호)
      try {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        document.body.setAttribute('data-theme', initialTheme);
      } catch (_) {}

      // 공통 UI 로딩
      await this.router.loadComponent('header.html', '#header');
      await this.router.loadComponent('sidebar.html', '#sidebar');

      // 라우팅 설정
      this.router.setupHistoryHandling();

      // 첫 페이지 로드
      const page = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
      await this.router.loadPage(page);
      this.bindGlobalUiHandlers();

      // 라우팅 이벤트
      window.addEventListener('hashchange', async () => {
        const target = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
        await this.router.loadPage(target);
      });

      // 성능 모니터링 (개발 환경에서만)
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development')
        || location.hostname === 'localhost';
      if (isDev) {
        this.setupPerformanceMonitoring();
      }

      this.isInitialized = true;
      this.logger.info('WorkFlow ATS initialized successfully!');
    } catch (error) {
      this.errorHandler.handle(error, 'App initialization failed');
      this.router.showErrorMessage('앱 초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  bindGlobalUiHandlers() {
    const toggleProfileMenu = (event) => {
      event?.stopPropagation();
      const menu = document.getElementById('profileMenu');
      if (!menu) return;
      menu.classList.toggle('hidden');
    };

    const logout = () => {
      this.authService.logout();
    };

    const updateThemeToggleIcon = () => {
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = (document.body.getAttribute('data-theme') === 'dark') ? '🌙' : '☀️';
    };

    // 저장된 테마 반영 후 아이콘 초기화
    const saved = localStorage.getItem('theme');
    if (saved) document.body.setAttribute('data-theme', saved);
    updateThemeToggleIcon();

    // 위임 이벤트: 헤더가 동적으로 교체되어도 동작
    document.addEventListener('click', (e) => {
      const target = e.target.closest('#themeToggle');
      if (!target) return;
      const cur = document.body.getAttribute('data-theme') || 'light';
      const next = cur === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeToggleIcon();
    });

    // 전역 바인딩
    window.toggleProfileMenu = toggleProfileMenu;
    window.logout = logout;

    // SPA 네비게이션 위임: data-page 클릭 시 해시 이동
    document.addEventListener('click', (e) => {
      const navTarget = e.target.closest('.nav-item, .sidebar-link, .quick-action-btn[data-page], [data-page]');
      if (!navTarget) return;
      const page = navTarget.getAttribute('data-page');
      if (!page) return;
      e.preventDefault();
      // intent 전달: 대시보드의 새 지원자 → candidates 로 이동 후 생성 모달 열기
      if (navTarget.hasAttribute('data-open-candidate-create')) {
        try { sessionStorage.setItem('openCandidateCreate', '1'); } catch (_) {}
      }
      const nextHash = `#${page}`;
      if (location.hash !== nextHash) {
        location.hash = nextHash;
      } else {
        // 동일 페이지 재진입 시 강제로 로드하고 싶다면 아래 주석 해제
        // this.router.loadPage(page);
      }
    });
  }

  setupPerformanceMonitoring() {
    try {
      import('../utils/performance.js').then(({ PerformanceMonitor }) => {
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.observeLCP();
        this.performanceMonitor.observeFID();
        this.performanceMonitor.observeCLS();
      });
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  cleanup() {
    if (this.performanceMonitor) {
      this.performanceMonitor.disconnect();
    }
    
    if (this.accessibility) {
      // 접근성 정리 작업이 있다면 여기에 추가
    }
  }

  

  /**
   * 인증 확인
   * @private
   */
  async checkAuthentication() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.info('User not authenticated, redirecting to login');
      window.location.href = './login.html';
      return;
    }
    
    this.state.dispatch({ type: 'app/setUser', payload: user });
    this.logger.debug('Authentication check completed');
  }

  /**
   * 시드 데이터 설정
   * @private
   */
  async setupSeedData() {
    try {
      const seeder = new SeedService();
      await seeder.seed();
      this.logger.debug('Seed data setup completed');
    } catch (error) {
      this.logger.warn('Seed data setup failed:', error);
    }
  }

  /**
   * 보안 설정
   * @private
   */
  async setupSecurity() {
    try {
      enforceHTTPS();
      setupCSP();
      this.logger.debug('Security setup completed');
    } catch (error) {
      this.logger.warn('Security setup failed:', error);
    }
  }

  /**
   * 국제화 설정
   * @private
   */
  async setupI18n() {
    try {
      this.i18n = createI18n({
        defaultLocale: 'ko',
        debug: false
      });
      this.i18n.subscribe((newLocale, oldLocale) => {
        this.logger.info(`Language changed: ${oldLocale} → ${newLocale}`);
        this.events.emit('app:language-changed', { newLocale, oldLocale });
      });
      this.logger.debug('I18n setup completed');
    } catch (error) {
      this.logger.warn('I18n setup failed:', error);
    }
  }

  /**
   * 접근성 설정
   * @private
   */
  async setupAccessibility() {
    try {
      this.accessibility = initializeAccessibility();
      this.logger.debug('Accessibility setup completed');
    } catch (error) {
      this.logger.warn('Accessibility setup failed:', error);
    }
  }

  /**
   * 상태 관리 초기화
   * @private
   */
  async setupStateManagement() {
    // 앱 상태 슬라이스 등록
    this.state.addSlice('app', {
      state: {
        loading: false,
        currentPage: null,
        user: null,
        language: 'ko',
        theme: 'light'
      },
      reducers: {
        setLoading: (state, action) => ({ ...state, loading: action.payload }),
        setCurrentPage: (state, action) => ({ ...state, currentPage: action.payload }),
        setUser: (state, action) => ({ ...state, user: action.payload }),
        setLanguage: (state, action) => ({ ...state, language: action.payload }),
        setTheme: (state, action) => ({ ...state, theme: action.payload })
      },
      actions: {
        setLoading: (loading) => ({ type: 'setLoading', payload: loading }),
        setCurrentPage: (page) => ({ type: 'setCurrentPage', payload: page }),
        setUser: (user) => ({ type: 'setUser', payload: user }),
        setLanguage: (language) => ({ type: 'setLanguage', payload: language }),
        setTheme: (theme) => ({ type: 'setTheme', payload: theme })
      }
    });

    this.logger.debug('State management setup completed');
  }

  /**
   * 지연 로딩 설정
   * @private
   */
  async setupLazyLoading() {
    // 이미지 지연 로딩
    this.lazyLoader.observeAll('img[data-src], img[data-lazy-src]');
    
    // 컴포넌트 지연 로딩
    this.lazyLoader.observeAll('[data-component]');
    
    this.logger.debug('Lazy loading setup completed');
  }

  /**
   * 라우터 설정
   * @private
   */
  async setupRouter() {
    this.router.setupHistoryHandling();
    this.logger.debug('Router setup completed');
  }
}


