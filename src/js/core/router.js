export class Router {
  async loadTemplate(path) {
    const url = `src/templates/${path}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.statusText);
      return await res.text();
    } catch (err) {
      console.error('Template loading failed:', err);
      return '<div style="padding:16px;">템플릿을 불러올 수 없습니다.</div>';
    }
  }

  async loadComponent(path, mountSelector) {
    const html = await this.loadTemplate(`components/${path}`);
    const mount = document.querySelector(mountSelector);
    if (mount) mount.innerHTML = html;
  }

  async loadPage(pageName) {
    const html = await this.loadTemplate(`pages/${pageName}-content.html`);
    const mount = document.querySelector('#main-content');
    if (mount) mount.innerHTML = html;

    // 페이지별 컨트롤러 동적 로딩
    const map = {
      dashboard: () => import('../pages/dashboard/dashboard-controller.js'),
      candidates: () => import('../pages/candidates/candidate-controller.js'),
      jobs: () => import('../pages/jobs/job-controller.js'),
      interviews: () => import('../pages/interviews/interview-controller.js')
    };
    const loader = map[pageName];
    if (loader) {
      try {
        const mod = await loader();
        // 컨트롤러가 export default class 인 경우를 기본 지원
        if (mod && typeof mod.default === 'function') {
          const instance = new mod.default();
          if (typeof instance.init === 'function') await instance.init();
        }
        // 또는 bootstrap 함수 제공 시 호출
        if (typeof mod.bootstrap === 'function') {
          await mod.bootstrap();
        }
      } catch (e) {
        console.error('컨트롤러 로딩 실패:', e);
      }
    }
  }
}


