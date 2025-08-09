class LoginForm {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.emailInput = document.getElementById('loginEmail');
    this.passwordInput = document.getElementById('loginPassword');
    this.rememberCheckbox = document.getElementById('rememberMe');
    this.loginBtn = document.getElementById('loginBtn');
    this.emailError = document.getElementById('emailError');
    this.passwordError = document.getElementById('passwordError');
    this.loginError = document.getElementById('loginError');
    this.isSubmitting = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupAutoComplete();
    this.validateOnInput();
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.passwordInput.addEventListener('blur', () => this.validatePassword());
    this.emailInput.addEventListener('input', () => this.clearError(this.emailError));
    this.passwordInput.addEventListener('input', () => this.clearError(this.passwordError));
  }

  setupAutoComplete() {
    this.emailInput.setAttribute('autocomplete', 'email');
    this.passwordInput.setAttribute('autocomplete', 'current-password');
  }

  validateOnInput() {
    let emailTimeout, passwordTimeout;
    this.emailInput.addEventListener('input', () => {
      clearTimeout(emailTimeout);
      emailTimeout = setTimeout(() => {
        if (this.emailInput.value.length > 0) this.validateEmail();
      }, 500);
    });
    this.passwordInput.addEventListener('input', () => {
      clearTimeout(passwordTimeout);
      passwordTimeout = setTimeout(() => {
        if (this.passwordInput.value.length > 0) this.validatePassword();
      }, 500);
    });
  }

  validateEmail() {
    const email = this.emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.showError(this.emailError, '이메일 주소를 입력해주세요.');
      this.setInputInvalid(this.emailInput, true);
      return false;
    }
    if (!emailRegex.test(email)) {
      this.showError(this.emailError, '유효한 이메일 주소를 입력해주세요.');
      this.setInputInvalid(this.emailInput, true);
      return false;
    }
    this.clearError(this.emailError);
    this.setInputInvalid(this.emailInput, false);
    return true;
  }

  validatePassword() {
    const password = this.passwordInput.value;
    if (!password) {
      this.showError(this.passwordError, '비밀번호를 입력해주세요.');
      this.setInputInvalid(this.passwordInput, true);
      return false;
    }
    if (password.length < 8) {
      this.showError(this.passwordError, '비밀번호는 8자 이상이어야 합니다.');
      this.setInputInvalid(this.passwordInput, true);
      return false;
    }
    this.clearError(this.passwordError);
    this.setInputInvalid(this.passwordInput, false);
    return true;
  }

  setInputInvalid(input, isInvalid) {
    input.setAttribute('aria-invalid', isInvalid.toString());
    if (isInvalid) input.classList.add('error');
    else input.classList.remove('error');
  }

  showError(errorElement, message) {
    const textElement = errorElement.querySelector('.error-text');
    if (textElement) textElement.textContent = message;
    errorElement.classList.add('show');
  }

  clearError(errorElement) {
    errorElement.classList.remove('show');
  }

  showLoginError(message) {
    const textElement = this.loginError.querySelector('.error-text');
    if (textElement) textElement.textContent = message;
    this.loginError.classList.add('show');
    setTimeout(() => this.loginError.classList.remove('show'), 5000);
  }

  setLoading(loading) {
    this.isSubmitting = loading;
    this.loginBtn.classList.toggle('loading', loading);
    this.loginBtn.setAttribute('aria-busy', loading.toString());
    this.loginBtn.disabled = loading;
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    const isEmailValid = this.validateEmail();
    const isPasswordValid = this.validatePassword();
    if (!isEmailValid || !isPasswordValid) return this.showLoginError('입력 정보를 확인해주세요.');
    this.setLoading(true);
    try {
      const success = await this.performLogin();
      if (success) this.handleLoginSuccess();
      else this.showLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } catch (error) {
      console.error('로그인 오류:', error);
      this.showLoginError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      this.setLoading(false);
    }
  }

  async performLogin() {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const validAccounts = [
      { email: 'test@example.com', password: 'password123', name: '김담당자', role: 'HR 매니저' },
      { email: 'admin@workflow.com', password: 'admin123', name: '관리자', role: '시스템 관리자' }
    ];
    const account = validAccounts.find(acc => acc.email === email && acc.password === password);
    if (!account) return false;
    const userData = { email: account.email, name: account.name, role: account.role, loginTime: new Date().toISOString() };
    if (this.rememberCheckbox.checked) localStorage.setItem('currentUser', JSON.stringify(userData));
    else sessionStorage.setItem('currentUser', JSON.stringify(userData));
    return true;
  }

  handleLoginSuccess() {
    this.showLoginError('로그인 성공! 페이지를 이동합니다...');
    setTimeout(() => { window.location.href = 'main.html'; }, 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoginForm();
  const firstInput = document.getElementById('loginEmail');
  if (firstInput) firstInput.focus();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW 등록 성공:', reg.scope))
      .catch(err => console.log('SW 등록 실패:', err));
  });
}


