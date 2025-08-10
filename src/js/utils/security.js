/**
 * 보안 유틸리티
 */

// XSS 방지를 위한 HTML 이스케이프
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 안전한 HTML 생성
export function createSafeHTML(template, data = {}) {
  let result = template;
  
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const escapedValue = typeof value === 'string' ? escapeHtml(value) : value;
    result = result.replace(placeholder, escapedValue);
  });
  
  return result;
}

// URL 검증
export function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// 안전한 리다이렉트
export function safeRedirect(url, allowedDomains = []) {
  if (!isValidURL(url)) {
    console.warn('Invalid URL for redirect:', url);
    return false;
  }
  
  const urlObj = new URL(url);
  const currentDomain = window.location.hostname;
  
  // 같은 도메인이거나 허용된 도메인인지 확인
  if (urlObj.hostname === currentDomain || 
      allowedDomains.includes(urlObj.hostname)) {
    window.location.href = url;
    return true;
  }
  
  console.warn('Redirect to external domain blocked:', url);
  return false;
}

// Content Security Policy 설정
export function setupCSP() {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob:;
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
  
  document.head.appendChild(meta);
}

// 입력 검증
export class InputValidator {
  // SQL 인젝션 패턴 감지
  static detectSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /('|"|;|--|\*|\/\*|\*\/)/,
      /(\bxp_|\bsp_)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // 스크립트 태그 감지
  static detectScript(input) {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b[^>]*>/i,
      /<object\b[^>]*>/i,
      /<embed\b[^>]*>/i
    ];
    
    return scriptPatterns.some(pattern => pattern.test(input));
  }

  // 종합 검증
  static validateInput(input, options = {}) {
    const {
      maxLength = 1000,
      allowHTML = false,
      allowSQL = false
    } = options;

    if (typeof input !== 'string') {
      return { valid: false, error: '입력값은 문자열이어야 합니다.' };
    }

    if (input.length > maxLength) {
      return { valid: false, error: `입력값이 너무 깁니다. (최대 ${maxLength}자)` };
    }

    if (!allowHTML && this.detectScript(input)) {
      return { valid: false, error: '허용되지 않는 HTML/스크립트가 포함되어 있습니다.' };
    }

    if (!allowSQL && this.detectSQLInjection(input)) {
      return { valid: false, error: '허용되지 않는 SQL 패턴이 포함되어 있습니다.' };
    }

    return { valid: true };
  }
}

// 세션 관리
export class SecureSession {
  constructor() {
    this.sessionKey = 'ats_session';
    this.maxAge = 24 * 60 * 60 * 1000; // 24시간
  }

  // 세션 데이터 암호화 (간단한 Base64 + 타임스탬프)
  encrypt(data) {
    const payload = {
      data,
      timestamp: Date.now(),
      checksum: this.generateChecksum(data)
    };
    return btoa(JSON.stringify(payload));
  }

  // 세션 데이터 복호화 및 검증
  decrypt(encryptedData) {
    try {
      const payload = JSON.parse(atob(encryptedData));
      
      // 만료 시간 확인
      if (Date.now() - payload.timestamp > this.maxAge) {
        throw new Error('Session expired');
      }

      // 체크섬 검증
      if (payload.checksum !== this.generateChecksum(payload.data)) {
        throw new Error('Session data integrity check failed');
      }

      return payload.data;
    } catch (error) {
      console.warn('Session decryption failed:', error.message);
      return null;
    }
  }

  // 간단한 체크섬 생성
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString(36);
  }

  // 세션 저장
  set(key, value, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    const encryptedValue = this.encrypt(value);
    storage.setItem(`${this.sessionKey}_${key}`, encryptedValue);
  }

  // 세션 불러오기
  get(key, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    const encryptedValue = storage.getItem(`${this.sessionKey}_${key}`);
    
    if (!encryptedValue) return null;
    
    const decryptedValue = this.decrypt(encryptedValue);
    
    // 복호화 실패 시 해당 키 삭제
    if (decryptedValue === null) {
      storage.removeItem(`${this.sessionKey}_${key}`);
    }
    
    return decryptedValue;
  }

  // 세션 삭제
  remove(key, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    storage.removeItem(`${this.sessionKey}_${key}`);
  }

  // 모든 세션 데이터 삭제
  clear() {
    [localStorage, sessionStorage].forEach(storage => {
      const keys = Object.keys(storage);
      keys.forEach(key => {
        if (key.startsWith(this.sessionKey)) {
          storage.removeItem(key);
        }
      });
    });
  }
}

// 안전한 로컬 스토리지 래퍼
export class SecureStorage {
  constructor(namespace = 'ats') {
    this.namespace = namespace;
    this.session = new SecureSession();
  }

  // 데이터 저장
  setItem(key, value, options = {}) {
    const { encrypt = true, persistent = true } = options;
    
    try {
      if (encrypt) {
        this.session.set(`${this.namespace}_${key}`, value, persistent);
      } else {
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem(`${this.namespace}_${key}`, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  // 데이터 불러오기
  getItem(key, options = {}) {
    const { encrypt = true, persistent = true } = options;
    
    try {
      if (encrypt) {
        return this.session.get(`${this.namespace}_${key}`, persistent);
      } else {
        const storage = persistent ? localStorage : sessionStorage;
        const value = storage.getItem(`${this.namespace}_${key}`);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  // 데이터 삭제
  removeItem(key, persistent = true) {
    this.session.remove(`${this.namespace}_${key}`, persistent);
  }

  // 네임스페이스 전체 삭제
  clear() {
    [localStorage, sessionStorage].forEach(storage => {
      const keys = Object.keys(storage);
      keys.forEach(key => {
        if (key.startsWith(`${this.namespace}_`)) {
          storage.removeItem(key);
        }
      });
    });
  }
}

// 파일 업로드 보안
export class SecureFileUpload {
  constructor(options = {}) {
    this.allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
  }

  // 파일 검증
  validateFile(file) {
    const errors = [];

    // 파일 크기 검사
    if (file.size > this.maxSize) {
      errors.push(`파일 크기가 너무 큽니다. (최대 ${Math.round(this.maxSize / 1024 / 1024)}MB)`);
    }

    // 파일 타입 검사
    if (!this.allowedTypes.includes(file.type)) {
      errors.push(`허용되지 않는 파일 형식입니다. (허용: ${this.allowedTypes.join(', ')})`);
    }

    // 파일명 검사 (경로 조작 방지)
    if (this.hasPathTraversal(file.name)) {
      errors.push('허용되지 않는 파일명입니다.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 경로 조작 공격 감지
  hasPathTraversal(filename) {
    const dangerous = ['../', '..\\', '%2e%2e%2f', '%252e%252e%252f'];
    return dangerous.some(pattern => 
      filename.toLowerCase().includes(pattern)
    );
  }

  // 파일을 안전한 Data URL로 변환
  async toSafeDataURL(file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

// 암호 강도 검사
export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommon: !isCommonPassword(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    score,
    strength,
    checks,
    suggestions: getPasswordSuggestions(checks)
  };
}

function isCommonPassword(password) {
  const common = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  return common.includes(password.toLowerCase());
}

function getPasswordSuggestions(checks) {
  const suggestions = [];
  
  if (!checks.length) suggestions.push('최소 8자 이상 사용하세요');
  if (!checks.lowercase) suggestions.push('소문자를 포함하세요');
  if (!checks.uppercase) suggestions.push('대문자를 포함하세요');
  if (!checks.numbers) suggestions.push('숫자를 포함하세요');
  if (!checks.symbols) suggestions.push('특수문자를 포함하세요');
  if (!checks.noCommon) suggestions.push('일반적인 암호는 피하세요');
  
  return suggestions;
}

// HTTPS 강제 적용
export function enforceHTTPS() {
  if (location.protocol === 'http:' && location.hostname !== 'localhost') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}

// 개발자 도구 감지 (간단한 방법)
export function detectDevTools() {
  let devtools = false;
  const threshold = 160;

  const checkDevTools = () => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools) {
        devtools = true;
        console.warn('개발자 도구가 감지되었습니다.');
        // 추가 보안 조치를 여기에 구현
      }
    } else {
      devtools = false;
    }
  };

  // 주기적으로 확인
  setInterval(checkDevTools, 500);
}

// 클립보드 보안
export async function secureClipboardWrite(text) {
  try {
    // 민감한 정보 필터링
    const filtered = text.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[카드번호]');
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(filtered);
      return true;
    } else {
      // 폴백: 임시 input 요소 사용
      const textArea = document.createElement('textarea');
      textArea.value = filtered;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('클립보드 쓰기 실패:', error);
    return false;
  }
}
