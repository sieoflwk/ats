export class Router {
  constructor() {
    this.currentPage = null;
    this.loadingPromise = null;
    this.pageCache = new Map();
  }

  async loadTemplate(path) {
    const url = `src/templates/${path}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.text();
    } catch (err) {
      console.error('Template loading failed:', err);
      return `<div style="padding:var(--space-4); text-align:center; color:var(--error);">
        <h3>템플릿을 불러올 수 없습니다</h3>
        <p>경로: ${path}</p>
        <p>오류: ${err.message}</p>
      </div>`;
    }
  }

  async loadComponent(path, mountSelector) {
    const html = await this.loadTemplate(`components/${path}`);
    const mount = document.querySelector(mountSelector);
    if (mount) {
      mount.innerHTML = html;
      // 컴포넌트 로드 후 이벤트 발생
      mount.dispatchEvent(new CustomEvent('component:loaded', { 
        detail: { path, mountSelector } 
      }));
    }
  }

  async loadPage(pageName) {
    // 동일한 페이지 재로딩 방지
    if (this.currentPage === pageName && !this.shouldReload(pageName)) {
      return;
    }

    // 진행중인 로딩이 있으면 취소
    if (this.loadingPromise) {
      try {
        await this.loadingPromise;
      } catch (e) {
        // 이전 로딩 실패 무시
      }
    }

    this.loadingPromise = this._loadPageInternal(pageName);
    
    try {
      await this.loadingPromise;
      this.currentPage = pageName;
    } catch (e) {
      console.error('Page loading failed:', e);
      this.showErrorPage(pageName, e);
    } finally {
      this.loadingPromise = null;
    }
  }

  async _loadPageInternal(pageName) {
    const mount = document.querySelector('#main-content');
    if (!mount) throw new Error('Main content container not found');

    // 로딩 상태 표시
    this.showLoadingState(mount);

    try {
      // 페이지 템플릿 로드
      const html = await this.loadTemplate(`pages/${pageName}-content.html`);
      
      // 페이지 전환 애니메이션
      await this.transitionPage(mount, html);

      // 네비게이션 상태 업데이트
      this.updateNavigation(pageName);

      // 컨트롤러 로드 및 초기화
      await this.loadController(pageName);

      // 페이지 로드 완료 이벤트
      window.dispatchEvent(new CustomEvent('page:loaded', { 
        detail: { pageName, timestamp: Date.now() } 
      }));

    } catch (error) {
      throw new Error(`Failed to load page "${pageName}": ${error.message}`);
    }
  }

  async transitionPage(mount, newHtml) {
    // 페이드 아웃
    mount.style.opacity = '0';
    mount.style.transform = 'translateY(10px)';
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 컨텐츠 교체
    mount.innerHTML = newHtml;
    
    // 페이드 인
    requestAnimationFrame(() => {
      mount.style.transition = 'opacity 250ms ease-out, transform 250ms ease-out';
      mount.style.opacity = '1';
      mount.style.transform = 'translateY(0)';
    });

    return new Promise(resolve => setTimeout(resolve, 250));
  }

  showLoadingState(mount) {
    mount.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:200px; color:var(--text-muted);">
        <div style="text-align:center;">
          <div style="width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto var(--space-3);"></div>
          <div>페이지를 로딩 중...</div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;
  }

  showErrorPage(pageName, error) {
    const mount = document.querySelector('#main-content');
    if (mount) {
      mount.innerHTML = `
        <div style="padding:var(--space-8); text-align:center; color:var(--text-secondary);">
          <div style="font-size:48px; margin-bottom:var(--space-4);">😓</div>
          <h2 style="color:var(--text-primary); margin-bottom:var(--space-3);">페이지를 불러올 수 없습니다</h2>
          <p style="margin-bottom:var(--space-4);">요청하신 페이지 "${pageName}"을(를) 로드하는 중 오류가 발생했습니다.</p>
          <details style="text-align:left; max-width:600px; margin:0 auto var(--space-4);">
            <summary style="cursor:pointer; color:var(--primary);">기술적 세부사항</summary>
            <pre style="background:var(--gray-100); padding:var(--space-3); border-radius:var(--radius); margin-top:var(--space-2); font-size:var(--font-size-xs); overflow:auto;">${error.message}</pre>
          </details>
          <div style="display:flex; gap:var(--space-3); justify-content:center;">
            <button class="btn btn-primary" onclick="location.reload()">새로고침</button>
            <button class="btn" onclick="location.hash='#dashboard'">대시보드로</button>
          </div>
        </div>
      `;
    }
  }

  updateNavigation(pageName) {
    // 네비게이션 아이템 활성 상태 업데이트
    document.querySelectorAll('.nav-item, .sidebar-link').forEach(item => {
      const page = item.getAttribute('data-page');
      item.classList.toggle('active', page === pageName);
    });

    // 문서 제목 업데이트
    const titles = {
      dashboard: '대시보드',
      candidates: '지원자 관리',
      jobs: '채용공고',
      interviews: '면접 관리',
      reports: '리포트',
      analytics: '성과 지표'
    };
    
    const pageTitle = titles[pageName] || pageName;
    document.title = `${pageTitle} - 워크플로우 ATS`;
  }

  async loadController(pageName) {
    const controllerMap = {
      dashboard: () => import('../pages/dashboard/dashboard-controller.js'),
      candidates: () => import('../pages/candidates/candidate-controller.js'),
      jobs: () => import('../pages/jobs/job-controller.js'),
      interviews: () => import('../pages/interviews/interview-controller.js')
    };

    const loader = controllerMap[pageName];
    if (!loader) return;

    try {
      const mod = await loader();
      
      // Default export class 인스턴스화
      if (mod && typeof mod.default === 'function') {
        const instance = new mod.default();
        if (typeof instance.init === 'function') {
          await instance.init();
        }
        return instance;
      }
      
      // Bootstrap 함수 호출
      if (typeof mod.bootstrap === 'function') {
        await mod.bootstrap();
      }
      
    } catch (e) {
      console.error(`Controller loading failed for ${pageName}:`, e);
      throw new Error(`Controller initialization failed: ${e.message}`);
    }
  }

  shouldReload(pageName) {
    // 특정 조건에서 페이지 재로드가 필요한 경우
    return false;
  }

  // 뒤로가기 히스토리 관리
  setupHistoryHandling() {
    window.addEventListener('popstate', (e) => {
      const page = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
      this.loadPage(page);
    });
  }

  // 페이지 프리페치
  async prefetchPage(pageName) {
    if (this.pageCache.has(pageName)) return;
    
    try {
      const html = await this.loadTemplate(`pages/${pageName}-content.html`);
      this.pageCache.set(pageName, html);
    } catch (e) {
      console.warn(`Failed to prefetch page ${pageName}:`, e);
    }
  }

  /**
   * 일반 오류 메시지 표시 (앱 레벨 메시지)
   * @param {string} message
   */
  showErrorMessage(message) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="error-container" style="padding: 40px; text-align: center;">
          <h2 style="color: var(--error); margin-bottom: 16px;">⚠️ 오류 발생</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">${message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            페이지 새로고침
          </button>
        </div>
      `;
    }
  }

  // 라우터 정리 (리스너 해제 등)
  cleanup() {
    // 현재 구현에서는 별도 정리할 리스너가 없음 (App에서 해시 변경 리스너를 관리)
  }
}


