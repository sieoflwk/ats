export class AuthService {
  getCurrentUser() {
    const legacy = localStorage.getItem('workflowUser') || sessionStorage.getItem('workflowUser');
    const saved = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || legacy;
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  }

  logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = './login.html';
  }
}


