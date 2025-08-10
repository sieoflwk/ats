/**
 * 통합 유틸리티 함수들
 * 자주 사용되는 기능들을 한 곳에 모음
 */

// 디바운스
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 쓰로틀
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 배열 유틸리티
export const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  chunk: (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },
  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const group = typeof key === 'function' ? key(item) : item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
};

// DOM 유틸리티
export const domUtils = {
  qs: (selector) => document.querySelector(selector),
  qsa: (selector) => document.querySelectorAll(selector),
  createElement: (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') el.className = value;
      else if (key === 'innerHTML') el.innerHTML = value;
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else el.appendChild(child);
    });
    return el;
  }
};

// 날짜 유틸리티
export const dateUtils = {
  format: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },
  isToday: (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  },
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
};

// 검증 유틸리티  
export const validation = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(phone),
  required: (value) => value !== null && value !== undefined && value !== '',
  minLength: (value, min) => String(value).length >= min,
  maxLength: (value, max) => String(value).length <= max
};

// 스토리지 유틸리티
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`wf:${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(`wf:${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    localStorage.removeItem(`wf:${key}`);
  },
  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('wf:'))
      .forEach(key => localStorage.removeItem(key));
  }
};

// HTTP 유틸리티
export const http = {
  get: async (url) => {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('HTTP GET Error:', error);
      throw error;
    }
  },
  post: async (url, data) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('HTTP POST Error:', error);
      throw error;
    }
  }
};

// 토스트 알림 (기존 UI 컴포넌트 사용)
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

// 확인 다이얼로그
export function showConfirm(message, onConfirm) {
  const modal = domUtils.createElement('div', {
    className: 'confirm-modal',
    innerHTML: `
      <div class="confirm-backdrop"></div>
      <div class="confirm-dialog">
        <h3>확인</h3>
        <p>${message}</p>
        <div class="confirm-buttons">
          <button class="btn-cancel">취소</button>
          <button class="btn-confirm">확인</button>
        </div>
      </div>
    `
  });
  
  // 스타일
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '10001',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  const backdrop = modal.querySelector('.confirm-backdrop');
  Object.assign(backdrop.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)'
  });
  
  const dialog = modal.querySelector('.confirm-dialog');
  Object.assign(dialog.style, {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '90%'
  });
  
  // 버튼 스타일
  modal.querySelectorAll('button').forEach(btn => {
    Object.assign(btn.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      margin: '0 4px'
    });
  });
  
  const cancelBtn = modal.querySelector('.btn-cancel');
  Object.assign(cancelBtn.style, {
    background: '#6b7280',
    color: 'white'
  });
  
  const confirmBtn = modal.querySelector('.btn-confirm');
  Object.assign(confirmBtn.style, {
    background: '#ef4444',
    color: 'white'
  });
  
  document.body.appendChild(modal);
  
  // 이벤트
  const close = () => modal.remove();
  
  backdrop.onclick = close;
  cancelBtn.onclick = close;
  confirmBtn.onclick = () => {
    close();
    onConfirm();
  };
}

// 로딩 스피너
export const spinner = {
  show: (message = '로딩 중...') => {
    if (document.querySelector('.loading-spinner')) return;
    
    const spinner = domUtils.createElement('div', {
      className: 'loading-spinner',
      innerHTML: `
        <div class="spinner-backdrop"></div>
        <div class="spinner-content">
          <div class="spinner-icon"></div>
          <div class="spinner-text">${message}</div>
        </div>
      `
    });
    
    Object.assign(spinner.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '10002',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    
    document.body.appendChild(spinner);
  },
  hide: () => {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
  }
};
