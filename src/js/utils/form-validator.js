/**
 * 실시간 폼 검증 유틸리티
 */

import { validateEmail, validatePhone, validateLength, validateRange } from './validation.js';

export class FormValidator {
  constructor(form) {
    this.form = form;
    this.validators = new Map();
    this.errors = new Map();
    this.bindEvents();
  }

  addValidator(fieldName, validator) {
    if (!this.validators.has(fieldName)) {
      this.validators.set(fieldName, []);
    }
    this.validators.get(fieldName).push(validator);
    return this;
  }

  bindEvents() {
    this.form.addEventListener('input', (e) => {
      const field = e.target;
      if (field.name || field.id) {
        this.validateField(field.name || field.id, field.value);
      }
    });

    this.form.addEventListener('blur', (e) => {
      const field = e.target;
      if (field.name || field.id) {
        this.validateField(field.name || field.id, field.value, true);
      }
    }, true);
  }

  validateField(fieldName, value, showError = false) {
    const validators = this.validators.get(fieldName) || [];
    let error = null;

    for (const validator of validators) {
      error = validator(value);
      if (error) break;
    }

    this.errors.set(fieldName, error);
    
    if (showError || this.hasBeenValidated(fieldName)) {
      this.showFieldError(fieldName, error);
    }

    return !error;
  }

  hasBeenValidated(fieldName) {
    const field = this.getField(fieldName);
    return field && field.hasAttribute('data-validated');
  }

  getField(fieldName) {
    return this.form.querySelector(`[name="${fieldName}"], #${fieldName}`);
  }

  showFieldError(fieldName, error) {
    const field = this.getField(fieldName);
    if (!field) return;

    field.setAttribute('data-validated', 'true');
    
    // 기존 에러 메시지 제거
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    if (error) {
      // 필드 스타일링
      field.style.borderColor = '#dc2626';
      field.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';

      // 에러 메시지 추가
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = error;
      Object.assign(errorEl.style, {
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      });
      
      const icon = document.createElement('span');
      icon.textContent = '⚠️';
      icon.style.fontSize = '12px';
      errorEl.prepend(icon);

      field.parentElement.appendChild(errorEl);
    } else {
      // 성공 스타일링
      field.style.borderColor = '#16a34a';
      field.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)';
    }
  }

  validateAll() {
    let isValid = true;
    
    for (const [fieldName] of this.validators) {
      const field = this.getField(fieldName);
      const value = field ? field.value : '';
      
      if (!this.validateField(fieldName, value, true)) {
        isValid = false;
      }
    }

    return isValid;
  }

  clearErrors() {
    this.errors.clear();
    
    // DOM에서 에러 표시 제거
    this.form.querySelectorAll('.field-error').forEach(el => el.remove());
    this.form.querySelectorAll('[data-validated]').forEach(field => {
      field.removeAttribute('data-validated');
      field.style.borderColor = '';
      field.style.boxShadow = '';
    });
  }

  getErrors() {
    return Array.from(this.errors.entries()).filter(([, error]) => error);
  }
}

// 일반적인 검증 규칙 팩토리 함수들
export const validators = {
  required: (message = '필수 입력 항목입니다.') => 
    (value) => (!value || !value.trim()) ? message : null,
    
  email: (message = '이메일 형식이 올바르지 않습니다.') => 
    (value) => value ? validateEmail(value) : null,
    
  phone: (message = '전화번호 형식이 올바르지 않습니다.') => 
    (value) => value ? validatePhone(value) : null,
    
  minLength: (min, message) => 
    (value) => value ? validateLength(value, min) : null,
    
  maxLength: (max, message) => 
    (value) => value ? validateLength(value, 0, max) : null,
    
  range: (min, max, message) => 
    (value) => value ? validateRange(Number(value), min, max) : null,
    
  pattern: (regex, message) => 
    (value) => (value && !regex.test(value)) ? message : null,
    
  custom: (validatorFn) => validatorFn
};
