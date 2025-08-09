export function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
    background: '#fff', border: '1px solid #e5e5e5', padding: '10px 14px',
    borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,.1)', fontSize: '14px'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}


