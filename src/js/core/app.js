import { Router } from './router.js';
import { AuthService } from '../services/auth-service.js';
import { EventBus } from './event-bus.js';
import { SeedService } from '../services/seed-service.js';

export class App {
  constructor() {
    this.router = new Router();
    this.authService = new AuthService();
    this.eventBus = new EventBus();
  }

  async initialize() {
    // 인증 확인
    const user = this.authService.getCurrentUser();
    if (!user) {
      window.location.href = './login.html';
      return;
    }

    // 초기 샘플 데이터 주입(최초 1회)
    const seeder = new SeedService();
    await seeder.seed();

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

    // 첫 페이지 로드
    const page = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
    await this.router.loadPage(page);
    this.bindGlobalUiHandlers();

    // 라우팅 이벤트
    window.addEventListener('hashchange', async () => {
      const target = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
      await this.router.loadPage(target);
    });
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
  }
}


