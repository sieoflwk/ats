/**
 * @fileoverview 폼 관련 유틸리티
 * 폼 데이터 처리, 검증, 직렬화 등
 */

/**
 * 폼 데이터 유틸리티
 */
export const data = {
  /**
   * 폼 데이터를 객체로 변환
   * @param {HTMLFormElement|FormData} form - 폼 요소 또는 FormData
   * @returns {Object}
   */
  serialize(form) {
    const formData = form instanceof FormData ? form : new FormData(form);
    const result = {};

    for (const [key, value] of formData.entries()) {
      if (result[key]) {
        // 동일한 이름의 필드가 여러 개인 경우 배열로 처리
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  },

  /**
   * 객체를 폼에 채우기
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Object} data - 데이터 객체
   */
  fill(form, data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;

      if (field.type === 'checkbox' || field.type === 'radio') {
        if (Array.isArray(value)) {
          field.forEach(f => f.checked = value.includes(f.value));
        } else {
          field.checked = field.value === String(value);
        }
      } else if (field.type === 'select-multiple') {
        Array.from(field.options).forEach(option => {
          option.selected = Array.isArray(value) ? value.includes(option.value) : false;
        });
      } else {
        field.value = value;
      }
    });
  },

  /**
   * 폼 초기화
   * @param {HTMLFormElement} form - 폼 요소
   */
  clear(form) {
    form.reset();
    
    // 커스텀 필드들도 초기화
    const customFields = form.querySelectorAll('.form-field');
    customFields.forEach(field => {
      field.classList.remove('error', 'success');
      const errorElement = field.querySelector('.field-error');
      if (errorElement) errorElement.textContent = '';
    });
  }
};

/**
 * 폼 검증 유틸리티
 */
export const validation = {
  /**
   * 실시간 검증 설정
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Object} rules - 검증 규칙
   * @param {Object} options - 옵션
   */
  setup(form, rules, options = {}) {
    const { 
      validateOnBlur = true, 
      validateOnInput = false,
      showErrors = true 
    } = options;

    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      const field = form.elements[fieldName];
      if (!field) return;

      if (validateOnBlur) {
        field.addEventListener('blur', () => {
          this.validateField(field, fieldRules, showErrors);
        });
      }

      if (validateOnInput) {
        field.addEventListener('input', () => {
          this.validateField(field, fieldRules, showErrors);
        });
      }
    });
  },

  /**
   * 개별 필드 검증
   * @param {HTMLElement} field - 필드 요소
   * @param {Object} rules - 검증 규칙
   * @param {boolean} showErrors - 에러 표시 여부
   * @returns {boolean}
   */
  validateField(field, rules, showErrors = true) {
    const value = field.value.trim();
    const errors = [];

    // 필수 입력 검증
    if (rules.required && !value) {
      errors.push(rules.required.message || '필수 입력 항목입니다.');
    }

    // 값이 있을 때만 나머지 검증 수행
    if (value) {
      // 최소 길이 검증
      if (rules.minLength && value.length < rules.minLength.value) {
        errors.push(rules.minLength.message || `최소 ${rules.minLength.value}글자 이상 입력하세요.`);
      }

      // 최대 길이 검증
      if (rules.maxLength && value.length > rules.maxLength.value) {
        errors.push(rules.maxLength.message || `최대 ${rules.maxLength.value}글자까지 입력 가능합니다.`);
      }

      // 패턴 검증
      if (rules.pattern && !rules.pattern.value.test(value)) {
        errors.push(rules.pattern.message || '올바른 형식으로 입력하세요.');
      }

      // 커스텀 검증
      if (rules.custom && typeof rules.custom.value === 'function') {
        const result = rules.custom.value(value);
        if (result !== true) {
          errors.push(result || rules.custom.message || '입력값이 올바르지 않습니다.');
        }
      }
    }

    // 에러 표시
    if (showErrors) {
      this.showFieldErrors(field, errors);
    }

    return errors.length === 0;
  },

  /**
   * 폼 전체 검증
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Object} rules - 검증 규칙
   * @returns {Object}
   */
  validateForm(form, rules) {
    const errors = {};
    let isValid = true;

    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      const field = form.elements[fieldName];
      if (!field) return;

      const fieldValid = this.validateField(field, fieldRules, true);
      if (!fieldValid) {
        isValid = false;
        errors[fieldName] = this.getFieldErrors(field);
      }
    });

    return { isValid, errors };
  },

  /**
   * 필드 에러 표시
   * @param {HTMLElement} field - 필드 요소
   * @param {string[]} errors - 에러 메시지 배열
   * @private
   */
  showFieldErrors(field, errors) {
    const wrapper = field.closest('.form-field') || field.parentElement;
    
    // 기존 에러 상태 제거
    wrapper.classList.remove('error', 'success');
    
    // 에러 메시지 요소 찾기 또는 생성
    let errorElement = wrapper.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      wrapper.appendChild(errorElement);
    }

    if (errors.length > 0) {
      wrapper.classList.add('error');
      errorElement.textContent = errors[0]; // 첫 번째 에러만 표시
      errorElement.style.display = 'block';
    } else {
      wrapper.classList.add('success');
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  },

  /**
   * 필드 에러 가져오기
   * @param {HTMLElement} field - 필드 요소
   * @returns {string[]}
   * @private
   */
  getFieldErrors(field) {
    const wrapper = field.closest('.form-field') || field.parentElement;
    const errorElement = wrapper.querySelector('.field-error');
    
    if (errorElement && errorElement.textContent) {
      return [errorElement.textContent];
    }
    
    return [];
  }
};

/**
 * 폼 상호작용 유틸리티
 */
export const interaction = {
  /**
   * 자동 저장 설정
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Function} saveFunction - 저장 함수
   * @param {Object} options - 옵션
   */
  autoSave(form, saveFunction, options = {}) {
    const { delay = 2000, storage = 'localStorage' } = options;
    let saveTimeout;

    const handleInput = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const formData = data.serialize(form);
        
        if (storage === 'localStorage') {
          localStorage.setItem(`autosave_${form.id || 'form'}`, JSON.stringify(formData));
        }
        
        if (saveFunction) {
          saveFunction(formData);
        }
      }, delay);
    };

    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleInput);

    // 저장된 데이터 복원
    this.restoreAutoSave(form, storage);
  },

  /**
   * 자동 저장 데이터 복원
   * @param {HTMLFormElement} form - 폼 요소
   * @param {string} storage - 저장소 타입
   */
  restoreAutoSave(form, storage = 'localStorage') {
    if (storage === 'localStorage') {
      const saved = localStorage.getItem(`autosave_${form.id || 'form'}`);
      if (saved) {
        try {
          const formData = JSON.parse(saved);
          data.fill(form, formData);
        } catch (e) {
          console.warn('Failed to restore autosave data:', e);
        }
      }
    }
  },

  /**
   * 폼 제출 처리
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Function} submitFunction - 제출 함수
   * @param {Object} options - 옵션
   */
  handleSubmit(form, submitFunction, options = {}) {
    const { 
      preventDouble = true, 
      showLoading = true,
      validateBeforeSubmit = null 
    } = options;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 중복 제출 방지
      if (preventDouble && form.dataset.submitting === 'true') {
        return;
      }

      // 제출 전 검증
      if (validateBeforeSubmit) {
        const validation = validateBeforeSubmit(form);
        if (!validation.isValid) {
          return;
        }
      }

      try {
        // 로딩 상태 표시
        if (showLoading) {
          this.setSubmitState(form, true);
        }

        const formData = data.serialize(form);
        await submitFunction(formData);

        // 성공 처리
        this.showSubmitSuccess(form);

      } catch (error) {
        // 에러 처리
        this.showSubmitError(form, error);
      } finally {
        // 로딩 상태 해제
        if (showLoading) {
          this.setSubmitState(form, false);
        }
      }
    });
  },

  /**
   * 제출 상태 설정
   * @param {HTMLFormElement} form - 폼 요소
   * @param {boolean} isSubmitting - 제출 중 여부
   * @private
   */
  setSubmitState(form, isSubmitting) {
    const submitButton = form.querySelector('[type="submit"]');
    
    if (isSubmitting) {
      form.dataset.submitting = 'true';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '처리 중...';
      }
    } else {
      form.dataset.submitting = 'false';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || '저장';
      }
    }
  },

  /**
   * 제출 성공 표시
   * @param {HTMLFormElement} form - 폼 요소
   * @private
   */
  showSubmitSuccess(form) {
    // 성공 메시지 표시 로직
    const message = document.createElement('div');
    message.className = 'alert alert-success';
    message.textContent = '저장되었습니다.';
    
    form.insertBefore(message, form.firstChild);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  },

  /**
   * 제출 에러 표시
   * @param {HTMLFormElement} form - 폼 요소
   * @param {Error} error - 에러 객체
   * @private
   */
  showSubmitError(form, error) {
    // 에러 메시지 표시 로직
    const message = document.createElement('div');
    message.className = 'alert alert-error';
    message.textContent = error.message || '저장 중 오류가 발생했습니다.';
    
    form.insertBefore(message, form.firstChild);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }
};

/**
 * 필드 타입별 유틸리티
 */
export const fields = {
  /**
   * 파일 입력 필드 향상
   * @param {HTMLInputElement} input - 파일 입력 요소
   * @param {Object} options - 옵션
   */
  enhanceFileInput(input, options = {}) {
    const { 
      accept = [], 
      maxSize = 10 * 1024 * 1024, // 10MB
      preview = false 
    } = options;

    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      
      // 파일 검증
      const validFiles = files.filter(file => {
        // 확장자 검증
        if (accept.length > 0) {
          const extension = file.name.split('.').pop().toLowerCase();
          if (!accept.includes(extension)) {
            this.showFileError(`지원하지 않는 파일 형식: ${extension}`);
            return false;
          }
        }

        // 크기 검증
        if (file.size > maxSize) {
          this.showFileError(`파일 크기가 너무 큽니다: ${file.name}`);
          return false;
        }

        return true;
      });

      // 미리보기 표시
      if (preview && validFiles.length > 0) {
        this.showFilePreview(input, validFiles);
      }
    });
  },

  /**
   * 파일 에러 표시
   * @param {string} message - 에러 메시지
   * @private
   */
  showFileError(message) {
    // 파일 에러 표시 로직
    console.error('File Error:', message);
  },

  /**
   * 파일 미리보기 표시
   * @param {HTMLInputElement} input - 파일 입력 요소
   * @param {File[]} files - 파일 배열
   * @private
   */
  showFilePreview(input, files) {
    const wrapper = input.closest('.form-field') || input.parentElement;
    let previewContainer = wrapper.querySelector('.file-preview');
    
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.className = 'file-preview';
      wrapper.appendChild(previewContainer);
    }

    previewContainer.innerHTML = files.map(file => `
      <div class="file-item">
        <span class="file-name">${file.name}</span>
        <span class="file-size">(${this.formatFileSize(file.size)})</span>
      </div>
    `).join('');
  },

  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 수
   * @returns {string}
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
