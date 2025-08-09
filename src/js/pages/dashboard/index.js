import DashboardController from './dashboard-controller.js';
document.addEventListener('DOMContentLoaded', async () => {
  const pageActive = location.hash.replace('#','') === 'dashboard' || location.hash === '';
  if (!pageActive) return;
  const dc = new DashboardController();
  await dc.init();
});


