/* main.html의 기능성 스크립트를 외부로 분리 */
/* 길이로 인해 핵심 진입부만 포함하고, 나머지는 main.html에서 점진적 분리 권장 */

// 안전 이스케이프
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 페이지 전환
function showPage(pageId) {
  document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');
  document.querySelectorAll('.header-nav .nav-item').forEach(a => {
    const p = a.getAttribute('data-page');
    a.classList.toggle('active', p === pageId);
  });
  document.querySelectorAll('.sidebar .sidebar-link').forEach(a => {
    const p = a.getAttribute('data-page');
    a.classList.toggle('active', p === pageId);
  });
  try { window.location.hash = `#${pageId}`; } catch (_) {}
  return false;
}

// 프로필 메뉴 토글
function toggleProfileMenu(event) {
  event?.stopPropagation();
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  menu.classList.toggle('hidden');
}

// 토스트
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// 인증 UI
function updateAuthUI(user) {
  document.querySelectorAll('.profile-name').forEach(el => el.textContent = user?.name || '게스트');
  document.querySelectorAll('.profile-role').forEach(el => el.textContent = user?.role || '');
}

function logout() {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }
}

// 테마 초기화
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.body.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  const setIcon = () => {
    if (btn) btn.textContent = (document.body.getAttribute('data-theme') === 'dark') ? '🌙' : '☀️';
  };
  if (btn) {
    setIcon();
    btn.addEventListener('click', () => {
      const cur = document.body.getAttribute('data-theme') || 'light';
      const next = cur === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      setIcon();
    });
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  const legacy = localStorage.getItem('workflowUser') || sessionStorage.getItem('workflowUser');
  const savedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || legacy;
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      updateAuthUI(user);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      const demoUser = { name: '김담당자', role: 'HR 매니저', email: 'test@example.com' };
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      updateAuthUI(demoUser);
    }
  } else {
    try { window.location.href = 'login.html'; } catch (_) {}
  }

  initTheme();
  const initial = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
  showPage(initial);

  document.addEventListener('click', (e) => {
    const pageEl = e.target.closest('.nav-item, .sidebar-link, .quick-action-btn[data-page]');
    if (!pageEl) return;
    const page = pageEl.getAttribute('data-page');
    if (!page) return;
    e.preventDefault();
    showPage(page);
  });

  window.showPage = showPage;
  window.toggleProfileMenu = toggleProfileMenu;
  window.showToast = showToast;
  window.logout = logout;
});

window.addEventListener('hashchange', () => {
  const target = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
  showPage(target);
});


