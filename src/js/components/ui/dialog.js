/**
 * 모던 확인/알림 다이얼로그
 */

export function showConfirm(message, title = '확인', options = {}) {
  return new Promise((resolve) => {
    const {
      confirmText = '확인',
      cancelText = '취소',
      type = 'confirm', // confirm, alert
      danger = false
    } = options;

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10001',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    });

    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '320px',
      maxWidth: '480px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transform: 'scale(0.9)',
      transition: 'transform 0.2s ease-out'
    });

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    Object.assign(titleEl.style, {
      margin: '0 0 12px 0',
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827'
    });

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    Object.assign(messageEl.style, {
      margin: '0 0 20px 0',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#6b7280'
    });

    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end'
    });

    function createButton(text, isPrimary = false, isDanger = false) {
      const btn = document.createElement('button');
      btn.textContent = text;
      Object.assign(btn.style, {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: isPrimary 
          ? (isDanger ? '#dc2626' : '#2563eb')
          : 'transparent',
        color: isPrimary ? '#fff' : '#6b7280',
        border: isPrimary ? 'none' : '1px solid #e5e7eb'
      });
      
      btn.addEventListener('mouseenter', () => {
        if (isPrimary) {
          btn.style.background = isDanger ? '#b91c1c' : '#1d4ed8';
        } else {
          btn.style.background = '#f9fafb';
        }
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = isPrimary 
          ? (isDanger ? '#dc2626' : '#2563eb')
          : 'transparent';
      });
      
      return btn;
    }

    if (type === 'confirm') {
      const cancelBtn = createButton(cancelText);
      const confirmBtn = createButton(confirmText, true, danger);
      
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
      
      confirmBtn.addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(confirmBtn);
    } else {
      const okBtn = createButton(confirmText, true);
      okBtn.addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });
      buttonContainer.appendChild(okBtn);
    }

    dialog.appendChild(titleEl);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);

    // ESC 키 처리
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleKeydown);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 배경 클릭으로 닫기
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        document.removeEventListener('keydown', handleKeydown);
        resolve(false);
      }
    });

    document.body.appendChild(overlay);

    // 애니메이션
    requestAnimationFrame(() => {
      dialog.style.transform = 'scale(1)';
    });
  });
}

export function showAlert(message, title = '알림') {
  return showConfirm(message, title, { type: 'alert' });
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);
