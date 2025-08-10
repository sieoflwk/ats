let toastContainer = null;

function createToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    Object.assign(toastContainer.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '10000',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px'
    });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'success', duration = 3000) {
  const container = createToastContainer();
  const el = document.createElement('div');
  
  const typeConfig = {
    success: { icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    error: { icon: '❌', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    warning: { icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
    info: { icon: 'ℹ️', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
  };
  
  const config = typeConfig[type] || typeConfig.success;
  
  el.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${config.icon}</span>
      <span style="flex: 1; line-height: 1.4;">${message}</span>
      <button style="background: none; border: none; cursor: pointer; padding: 2px; color: ${config.color}; font-size: 18px; opacity: 0.7;" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  Object.assign(el.style, {
    background: config.bg,
    border: `1px solid ${config.border}`,
    color: config.color,
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '14px',
    fontWeight: '500',
    transform: 'translateX(100%)',
    transition: 'all 0.3s ease-out',
    cursor: 'pointer'
  });
  
  container.appendChild(el);
  
  // 애니메이션
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(0)';
  });
  
  // 클릭으로 닫기
  el.addEventListener('click', () => {
    el.style.transform = 'translateX(100%)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  });
  
  // 자동 제거
  if (duration > 0) {
    setTimeout(() => {
      if (el.parentElement) {
        el.style.transform = 'translateX(100%)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }
    }, duration);
  }
  
  return el;
}


