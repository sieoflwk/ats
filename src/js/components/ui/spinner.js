/** Global loading overlay */
let overlayEl = null;

export function showLoading(message = '처리 중...') {
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    Object.assign(overlayEl.style, {
      position: 'fixed', inset: '0', background: 'rgba(255,255,255,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(2px)', fontSize: '14px', color: '#111827'
    });
    const box = document.createElement('div');
    Object.assign(box.style, {
      background: '#fff', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,.08)'
    });
    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
      width: '16px', height: '16px', border: '2px solid #e5e7eb', borderTopColor: '#111827', borderRadius: '50%',
      animation: 'wfspin 1s linear infinite'
    });
    const text = document.createElement('div');
    text.textContent = message;
    box.appendChild(spinner); box.appendChild(text); overlayEl.appendChild(box);
    const style = document.createElement('style');
    style.textContent = '@keyframes wfspin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  if (!document.body.contains(overlayEl)) document.body.appendChild(overlayEl);
}

export function hideLoading() {
  if (overlayEl && document.body.contains(overlayEl)) document.body.removeChild(overlayEl);
}


