/**
 * @fileoverview 보안 관련 유틸리티
 * XSS 방지, 데이터 검증, 암호화 등
 */

/**
 * XSS 방지 유틸리티
 */
export const xss = {
  /**
   * HTML 문자열 이스케이프
   * @param {string} html - HTML 문자열
   * @returns {string}
   */
  escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * HTML 속성값 이스케이프
   * @param {string} attr - 속성값
   * @returns {string}
   */
  escapeAttribute(attr) {
    return String(attr)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /**
   * JavaScript 문자열 이스케이프
   * @param {string} str - 문자열
   * @returns {string}
   */
  escapeJS(str) {
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  },

  /**
   * 안전한 HTML 생성 (템플릿 태그)
   * @param {TemplateStringsArray} strings - 템플릿 문자열
   * @param {...any} values - 값들
   * @returns {string}
   */
  safeHTML(strings, ...values) {
    let result = strings[0];
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const escaped = typeof value === 'string' ? this.escapeHTML(value) : String(value);
      result += escaped + strings[i + 1];
    }
    
    return result;
  },

  /**
   * 허용된 태그만 유지하며 HTML 정리
   * @param {string} html - HTML 문자열
   * @param {string[]} allowedTags - 허용된 태그들
   * @returns {string}
   */
  sanitizeHTML(html, allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']) {
    const div = document.createElement('div');
    div.innerHTML = html;

    const walker = document.createTreeWalker(
      div,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    const nodesToRemove = [];
    let node;

    while (node = walker.nextNode()) {
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        nodesToRemove.push(node);
      } else {
        // 허용된 태그에서도 이벤트 속성 제거
        this.removeEventAttributes(node);
      }
    }

    nodesToRemove.forEach(node => {
      if (node.parentNode) {
        // 태그는 제거하고 내용은 유지
        while (node.firstChild) {
          node.parentNode.insertBefore(node.firstChild, node);
        }
        node.parentNode.removeChild(node);
      }
    });

    return div.innerHTML;
  },

  /**
   * 이벤트 속성 제거
   * @param {Element} element - 요소
   * @private
   */
  removeEventAttributes(element) {
    const eventAttrs = [];
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('on') || attr.name === 'javascript:') {
        eventAttrs.push(attr.name);
      }
    }

    eventAttrs.forEach(attr => element.removeAttribute(attr));
  }
};

/**
 * 입력 검증 및 필터링
 */
export const input = {
  /**
   * SQL 인젝션 패턴 감지
   * @param {string} input - 입력값
   * @returns {boolean}
   */
  hasSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(;|\||&|\$|\+|,|\/|\*|%|=|>|<|!)/,
      /('|(\\')|('')|("|(\\")|("")|(\\")|(\\''))/,
      /((\%27)|(\'))/,
      /((\%6F)|o|(\%4F))((\%72)|r|(\%52))/,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  /**
   * 스크립트 인젝션 패턴 감지
   * @param {string} input - 입력값
   * @returns {boolean}
   */
  hasScriptInjection(input) {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i
    ];

    return scriptPatterns.some(pattern => pattern.test(input));
  },

  /**
   * 파일 경로 조작 감지
   * @param {string} path - 파일 경로
   * @returns {boolean}
   */
  hasPathTraversal(path) {
    const traversalPatterns = [
      /\.\./,
      /\.\\/,
      /\.\/\./,
      /\\\.\./,
      /%2e%2e/i,
      /%c0%ae/i,
      /%252e/i
    ];

    return traversalPatterns.some(pattern => pattern.test(path));
  },

  /**
   * 안전한 문자만 허용
   * @param {string} input - 입력값
   * @param {string} allowedChars - 허용된 문자 패턴
   * @returns {string}
   */
  sanitize(input, allowedChars = 'a-zA-Z0-9\\s\\-_') {
    const pattern = new RegExp(`[^${allowedChars}]`, 'g');
    return input.replace(pattern, '');
  },

  /**
   * 최대 길이 제한
   * @param {string} input - 입력값
   * @param {number} maxLength - 최대 길이
   * @returns {string}
   */
  truncate(input, maxLength) {
    return input.length > maxLength ? input.substring(0, maxLength) : input;
  },

  /**
   * 안전한 파일명 생성
   * @param {string} filename - 파일명
   * @returns {string}
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^\.+/, '')
      .substring(0, 255);
  }
};

/**
 * 토큰 및 세션 관리
 */
export const token = {
  /**
   * CSRF 토큰 생성
   * @returns {string}
   */
  generateCSRF() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * 세션 토큰 생성
   * @param {number} length - 토큰 길이
   * @returns {string}
   */
  generateSession(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  },

  /**
   * JWT 토큰 디코딩 (검증 없음, 클라이언트 사이드용)
   * @param {string} token - JWT 토큰
   * @returns {Object|null}
   */
  decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  },

  /**
   * 토큰 만료 확인
   * @param {string} token - JWT 토큰
   * @returns {boolean}
   */
  isTokenExpired(token) {
    const payload = this.decodeJWT(token);
    if (!payload || !payload.exp) return true;

    return Date.now() >= payload.exp * 1000;
  }
};

/**
 * 암호화 유틸리티 (브라우저 기본)
 */
export const crypto = {
  /**
   * 해시 생성 (SHA-256)
   * @param {string} data - 데이터
   * @returns {Promise<string>}
   */
  async hash(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * 랜덤 문자열 생성
   * @param {number} length - 길이
   * @returns {string}
   */
  randomString(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * UUID v4 생성
   * @returns {string}
   */
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * 간단한 대칭 암호화 (Base64 기반)
   * @param {string} data - 데이터
   * @param {string} key - 키
   * @returns {string}
   */
  simpleEncrypt(data, key) {
    const keyHash = key.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ (keyHash % 256));
    }
    
    return btoa(result);
  },

  /**
   * 간단한 대칭 복호화
   * @param {string} encryptedData - 암호화된 데이터
   * @param {string} key - 키
   * @returns {string}
   */
  simpleDecrypt(encryptedData, key) {
    try {
      const data = atob(encryptedData);
      const keyHash = key.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);

      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ (keyHash % 256));
      }
      
      return result;
    } catch (error) {
      return '';
    }
  }
};

/**
 * 보안 헤더 및 정책
 */
export const headers = {
  /**
   * Content Security Policy 생성
   * @param {Object} policies - 정책 객체
   * @returns {string}
   */
  generateCSP(policies = {}) {
    const defaults = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    };

    const merged = { ...defaults, ...policies };
    
    return Object.entries(merged)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  },

  /**
   * 보안 헤더 설정 (메타 태그로)
   * @param {Object} options - 옵션
   */
  setSecurityHeaders(options = {}) {
    const {
      csp = true,
      nosniff = true,
      xssProtection = true,
      frameOptions = 'DENY',
      hsts = false
    } = options;

    // CSP 메타 태그
    if (csp && typeof csp === 'object') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.generateCSP(csp);
      document.head.appendChild(meta);
    }

    // X-Content-Type-Options
    if (nosniff) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Content-Type-Options';
      meta.content = 'nosniff';
      document.head.appendChild(meta);
    }

    // X-XSS-Protection
    if (xssProtection) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-XSS-Protection';
      meta.content = '1; mode=block';
      document.head.appendChild(meta);
    }

    // X-Frame-Options
    if (frameOptions) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Frame-Options';
      meta.content = frameOptions;
      document.head.appendChild(meta);
    }
  }
};

/**
 * 보안 모니터링
 */
export const monitor = {
  /**
   * 의심스러운 활동 감지
   * @param {Object} options - 옵션
   */
  detectSuspiciousActivity(options = {}) {
    const {
      rapidClicks = true,
      devToolsDetection = true,
      consoleAccess = true
    } = options;

    // 빠른 클릭 감지
    if (rapidClicks) {
      let clickCount = 0;
      let clickTimer;

      document.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
          if (clickCount > 10) {
            this.reportSuspiciousActivity('rapid_clicks', { count: clickCount });
          }
          clickCount = 0;
        }, 1000);
      });
    }

    // 개발자 도구 감지 (간단한 방법)
    if (devToolsDetection) {
      setInterval(() => {
        const start = performance.now();
        debugger; // 개발자 도구가 열려있으면 여기서 멈춤
        const end = performance.now();
        
        if (end - start > 100) {
          this.reportSuspiciousActivity('devtools_detected');
        }
      }, 5000);
    }

    // 콘솔 접근 감지
    if (consoleAccess) {
      const originalLog = console.log;
      console.log = function(...args) {
        monitor.reportSuspiciousActivity('console_access', { args });
        return originalLog.apply(console, arguments);
      };
    }
  },

  /**
   * 의심스러운 활동 보고
   * @param {string} type - 활동 타입
   * @param {Object} data - 추가 데이터
   * @private
   */
  reportSuspiciousActivity(type, data = {}) {
    // 실제 구현에서는 서버로 전송
    console.warn('Suspicious activity detected:', type, data);
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('security:suspicious-activity', {
      detail: { type, data, timestamp: Date.now() }
    }));
  }
};

/**
 * 권한 관리
 */
export const permissions = {
  /**
   * 사용자 권한 확인
   * @param {string|string[]} required - 필요한 권한
   * @param {string[]} userPermissions - 사용자 권한
   * @returns {boolean}
   */
  hasPermission(required, userPermissions) {
    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.every(perm => userPermissions.includes(perm));
  },

  /**
   * 관리자 권한 확인
   * @param {string[]} userRoles - 사용자 역할
   * @returns {boolean}
   */
  isAdmin(userRoles) {
    return userRoles.includes('admin') || userRoles.includes('super_admin');
  },

  /**
   * 리소스 접근 권한 확인
   * @param {string} resource - 리소스
   * @param {string} action - 액션
   * @param {Object} user - 사용자 정보
   * @returns {boolean}
   */
  canAccess(resource, action, user) {
    if (!user || !user.permissions) return false;
    
    // 관리자는 모든 권한
    if (this.isAdmin(user.roles || [])) return true;
    
    // 특정 권한 확인
    const permission = `${resource}:${action}`;
    return user.permissions.includes(permission) || user.permissions.includes(`${resource}:*`);
  }
};
