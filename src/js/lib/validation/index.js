/**
 * @fileoverview 검증 관련 유틸리티
 * 다양한 데이터 타입의 검증 규칙과 함수들
 */

/**
 * 기본 검증 규칙
 */
export const rules = {
  /**
   * 필수 입력 검증
   * @param {any} value - 검증할 값
   * @returns {boolean}
   */
  required(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * 이메일 형식 검증
   * @param {string} email - 이메일 주소
   * @returns {boolean}
   */
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * URL 형식 검증
   * @param {string} url - URL
   * @returns {boolean}
   */
  url(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 전화번호 형식 검증
   * @param {string} phone - 전화번호
   * @param {string} format - 형식 ('kr', 'us', 'international')
   * @returns {boolean}
   */
  phone(phone, format = 'kr') {
    const patterns = {
      kr: /^01[0-9]-\d{3,4}-\d{4}$|^01[0-9]\d{7,8}$/,
      us: /^\(\d{3}\) \d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$/,
      international: /^\+\d{1,3}\d{4,14}$/
    };
    
    return patterns[format]?.test(phone) || false;
  },

  /**
   * 숫자 범위 검증
   * @param {number} value - 값
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {boolean}
   */
  range(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  /**
   * 문자열 길이 검증
   * @param {string} value - 문자열
   * @param {number} min - 최소 길이
   * @param {number} max - 최대 길이
   * @returns {boolean}
   */
  length(value, min, max) {
    const str = String(value);
    return str.length >= min && str.length <= max;
  },

  /**
   * 정규식 패턴 검증
   * @param {string} value - 검증할 값
   * @param {RegExp} pattern - 정규식 패턴
   * @returns {boolean}
   */
  pattern(value, pattern) {
    return pattern.test(value);
  },

  /**
   * 날짜 형식 검증
   * @param {string} date - 날짜 문자열
   * @param {string} format - 형식 ('YYYY-MM-DD', 'MM/DD/YYYY' 등)
   * @returns {boolean}
   */
  date(date, format = 'YYYY-MM-DD') {
    const patterns = {
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
      'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/
    };

    if (!patterns[format]?.test(date)) return false;

    // 실제 날짜 유효성 검사
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  },

  /**
   * 시간 형식 검증
   * @param {string} time - 시간 문자열
   * @param {boolean} is24Hour - 24시간 형식 여부
   * @returns {boolean}
   */
  time(time, is24Hour = true) {
    const pattern24 = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const pattern12 = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    
    return is24Hour ? pattern24.test(time) : pattern12.test(time);
  },

  /**
   * 신용카드 번호 검증 (Luhn 알고리즘)
   * @param {string} cardNumber - 카드 번호
   * @returns {boolean}
   */
  creditCard(cardNumber) {
    const num = cardNumber.replace(/\s|-/g, '');
    if (!/^\d+$/.test(num)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * 비밀번호 강도 검증
   * @param {string} password - 비밀번호
   * @param {Object} options - 옵션
   * @returns {boolean}
   */
  password(password, options = {}) {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      forbiddenChars = []
    } = options;

    // 길이 검사
    if (password.length < minLength) return false;

    // 금지된 문자 검사
    if (forbiddenChars.some(char => password.includes(char))) return false;

    // 대문자 검사
    if (requireUppercase && !/[A-Z]/.test(password)) return false;

    // 소문자 검사
    if (requireLowercase && !/[a-z]/.test(password)) return false;

    // 숫자 검사
    if (requireNumbers && !/\d/.test(password)) return false;

    // 특수문자 검사
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  },

  /**
   * 주민등록번호 검증 (한국)
   * @param {string} ssn - 주민등록번호
   * @returns {boolean}
   */
  koreanSSN(ssn) {
    const cleaned = ssn.replace(/-/g, '');
    if (!/^\d{13}$/.test(cleaned)) return false;

    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights[i];
    }

    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleaned[12]);
  },

  /**
   * 사업자등록번호 검증 (한국)
   * @param {string} brn - 사업자등록번호
   * @returns {boolean}
   */
  koreanBRN(brn) {
    const cleaned = brn.replace(/-/g, '');
    if (!/^\d{10}$/.test(cleaned)) return false;

    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * weights[i];
    }

    sum += Math.floor((parseInt(cleaned[8]) * 5) / 10);
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return checkDigit === parseInt(cleaned[9]);
  }
};

/**
 * 검증 스키마 클래스
 */
export class ValidationSchema {
  constructor() {
    this.fields = new Map();
  }

  /**
   * 필드 규칙 추가
   * @param {string} fieldName - 필드명
   * @param {Object} fieldRules - 필드 규칙
   * @returns {ValidationSchema}
   */
  field(fieldName, fieldRules) {
    this.fields.set(fieldName, fieldRules);
    return this;
  }

  /**
   * 객체 검증
   * @param {Object} data - 검증할 데이터
   * @returns {Object}
   */
  validate(data) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of this.fields) {
      const value = data[fieldName];
      const fieldErrors = this.validateField(value, fieldRules);

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * 개별 필드 검증
   * @param {any} value - 값
   * @param {Object} fieldRules - 필드 규칙
   * @returns {string[]}
   * @private
   */
  validateField(value, fieldRules) {
    const errors = [];

    // 필수 입력 검증
    if (fieldRules.required && !rules.required(value)) {
      errors.push(fieldRules.required.message || '필수 입력 항목입니다.');
      return errors; // 필수값이 없으면 다른 검증 스킵
    }

    // 값이 없으면 다른 검증 스킵 (required가 false인 경우)
    if (!rules.required(value)) {
      return errors;
    }

    // 타입 검증
    if (fieldRules.type) {
      if (!this.validateType(value, fieldRules.type)) {
        errors.push(fieldRules.type.message || `올바른 ${fieldRules.type.name} 형식이 아닙니다.`);
      }
    }

    // 길이 검증
    if (fieldRules.length) {
      const { min, max } = fieldRules.length;
      if (!rules.length(value, min || 0, max || Infinity)) {
        errors.push(fieldRules.length.message || `${min}~${max}글자로 입력하세요.`);
      }
    }

    // 범위 검증
    if (fieldRules.range) {
      const { min, max } = fieldRules.range;
      if (!rules.range(value, min, max)) {
        errors.push(fieldRules.range.message || `${min}~${max} 범위의 값을 입력하세요.`);
      }
    }

    // 패턴 검증
    if (fieldRules.pattern) {
      if (!rules.pattern(value, fieldRules.pattern.value)) {
        errors.push(fieldRules.pattern.message || '올바른 형식으로 입력하세요.');
      }
    }

    // 커스텀 검증
    if (fieldRules.custom) {
      const result = fieldRules.custom.validator(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : fieldRules.custom.message);
      }
    }

    return errors;
  }

  /**
   * 타입 검증
   * @param {any} value - 값
   * @param {Object} typeRule - 타입 규칙
   * @returns {boolean}
   * @private
   */
  validateType(value, typeRule) {
    switch (typeRule.name) {
      case 'email':
        return rules.email(value);
      case 'url':
        return rules.url(value);
      case 'phone':
        return rules.phone(value, typeRule.format);
      case 'date':
        return rules.date(value, typeRule.format);
      case 'time':
        return rules.time(value, typeRule.is24Hour);
      case 'number':
        return !isNaN(Number(value));
      case 'integer':
        return Number.isInteger(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      default:
        return true;
    }
  }
}

/**
 * 실시간 검증기 클래스
 */
export class RealTimeValidator {
  constructor(form, schema, options = {}) {
    this.form = form;
    this.schema = schema;
    this.options = {
      validateOnInput: false,
      validateOnBlur: true,
      showErrors: true,
      debounceDelay: 300,
      ...options
    };

    this.debounceTimers = new Map();
    this.fieldStates = new Map();

    this.init();
  }

  /**
   * 초기화
   * @private
   */
  init() {
    for (const [fieldName] of this.schema.fields) {
      const field = this.form.elements[fieldName];
      if (!field) continue;

      if (this.options.validateOnInput) {
        field.addEventListener('input', (e) => this.handleInput(e, fieldName));
      }

      if (this.options.validateOnBlur) {
        field.addEventListener('blur', (e) => this.handleBlur(e, fieldName));
      }
    }
  }

  /**
   * 입력 이벤트 처리
   * @param {Event} event - 이벤트
   * @param {string} fieldName - 필드명
   * @private
   */
  handleInput(event, fieldName) {
    clearTimeout(this.debounceTimers.get(fieldName));
    
    const timer = setTimeout(() => {
      this.validateField(fieldName);
    }, this.options.debounceDelay);

    this.debounceTimers.set(fieldName, timer);
  }

  /**
   * 블러 이벤트 처리
   * @param {Event} event - 이벤트
   * @param {string} fieldName - 필드명
   * @private
   */
  handleBlur(event, fieldName) {
    clearTimeout(this.debounceTimers.get(fieldName));
    this.validateField(fieldName);
  }

  /**
   * 필드 검증
   * @param {string} fieldName - 필드명
   * @returns {boolean}
   */
  validateField(fieldName) {
    const field = this.form.elements[fieldName];
    if (!field) return true;

    const fieldRules = this.schema.fields.get(fieldName);
    if (!fieldRules) return true;

    const value = field.value;
    const errors = this.schema.validateField(value, fieldRules);
    
    this.fieldStates.set(fieldName, {
      isValid: errors.length === 0,
      errors
    });

    if (this.options.showErrors) {
      this.showFieldErrors(field, errors);
    }

    return errors.length === 0;
  }

  /**
   * 전체 폼 검증
   * @returns {Object}
   */
  validateForm() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());
    
    return this.schema.validate(data);
  }

  /**
   * 필드 에러 표시
   * @param {HTMLElement} field - 필드 요소
   * @param {string[]} errors - 에러 배열
   * @private
   */
  showFieldErrors(field, errors) {
    const wrapper = field.closest('.form-field') || field.parentElement;
    
    // 기존 상태 제거
    wrapper.classList.remove('error', 'success');
    
    let errorElement = wrapper.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      wrapper.appendChild(errorElement);
    }

    if (errors.length > 0) {
      wrapper.classList.add('error');
      errorElement.textContent = errors[0];
      errorElement.style.display = 'block';
    } else {
      wrapper.classList.add('success');
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  /**
   * 에러 표시 초기화
   */
  clearErrors() {
    const errorElements = this.form.querySelectorAll('.field-error');
    errorElements.forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    const fieldWrappers = this.form.querySelectorAll('.form-field');
    fieldWrappers.forEach(wrapper => {
      wrapper.classList.remove('error', 'success');
    });

    this.fieldStates.clear();
  }

  /**
   * 필드 상태 조회
   * @param {string} fieldName - 필드명
   * @returns {Object|null}
   */
  getFieldState(fieldName) {
    return this.fieldStates.get(fieldName) || null;
  }

  /**
   * 정리
   */
  destroy() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.fieldStates.clear();
  }
}

/**
 * 빠른 검증 함수들
 */
export const quick = {
  /**
   * 이메일 검증
   * @param {string} email - 이메일
   * @returns {boolean}
   */
  isEmail: (email) => rules.email(email),

  /**
   * 전화번호 검증
   * @param {string} phone - 전화번호
   * @returns {boolean}
   */
  isPhone: (phone) => rules.phone(phone),

  /**
   * URL 검증
   * @param {string} url - URL
   * @returns {boolean}
   */
  isURL: (url) => rules.url(url),

  /**
   * 비어있지 않은 문자열 검증
   * @param {string} str - 문자열
   * @returns {boolean}
   */
  isNotEmpty: (str) => rules.required(str),

  /**
   * 숫자 검증
   * @param {any} value - 값
   * @returns {boolean}
   */
  isNumber: (value) => !isNaN(Number(value)) && isFinite(Number(value)),

  /**
   * 정수 검증
   * @param {any} value - 값
   * @returns {boolean}
   */
  isInteger: (value) => Number.isInteger(Number(value)),

  /**
   * 양수 검증
   * @param {any} value - 값
   * @returns {boolean}
   */
  isPositive: (value) => Number(value) > 0,

  /**
   * 날짜 검증
   * @param {string} date - 날짜 문자열
   * @returns {boolean}
   */
  isDate: (date) => rules.date(date),

  /**
   * 신용카드 번호 검증
   * @param {string} cardNumber - 카드 번호
   * @returns {boolean}
   */
  isCreditCard: (cardNumber) => rules.creditCard(cardNumber)
};

/**
 * 검증 스키마 빌더
 * @returns {ValidationSchema}
 */
export function schema() {
  return new ValidationSchema();
}
