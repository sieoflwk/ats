import { App } from './core/app-simple.js';

// 간단한 에러 핸들링
window.addEventListener('error', (e) => {
  console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
});

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  
  // 성능 모니터링 시작 (개발 환경에서만)
  if (location.hostname === 'localhost') {
    app.setupPerformanceMonitoring();
  }
  
  await app.initialize();
  
  // 전역 앱 인스턴스로 등록 (디버깅용)
  window.app = app;
});
