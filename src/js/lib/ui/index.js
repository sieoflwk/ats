/**
 * @fileoverview UI 관련 유틸리티
 * 애니메이션, 테마, 상호작용 등 UI/UX 기능
 */

/**
 * 애니메이션 유틸리티
 */
export const animation = {
  /**
   * 요소 페이드인
   * @param {Element} element - 요소
   * @param {number} duration - 지속시간 (ms)
   * @param {Function} onComplete - 완료 콜백
   */
  fadeIn(element, duration = 300, onComplete) {
    element.style.opacity = '0';
    element.style.display = 'block';

    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  },

  /**
   * 요소 페이드아웃
   * @param {Element} element - 요소
   * @param {number} duration - 지속시간 (ms)
   * @param {Function} onComplete - 완료 콜백
   */
  fadeOut(element, duration = 300, onComplete) {
    const start = performance.now();
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = initialOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        if (onComplete) onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  },

  /**
   * 슬라이드 업 애니메이션
   * @param {Element} element - 요소
   * @param {number} duration - 지속시간 (ms)
   * @param {Function} onComplete - 완료 콜백
   */
  slideUp(element, duration = 300, onComplete) {
    const height = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.height = '0px';
      
      setTimeout(() => {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        if (onComplete) onComplete();
      }, duration);
    });
  },

  /**
   * 슬라이드 다운 애니메이션
   * @param {Element} element - 요소
   * @param {number} duration - 지속시간 (ms)
   * @param {Function} onComplete - 완료 콜백
   */
  slideDown(element, duration = 300, onComplete) {
    element.style.display = 'block';
    const height = element.scrollHeight;
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.height = height + 'px';
      
      setTimeout(() => {
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        if (onComplete) onComplete();
      }, duration);
    });
  }
};

/**
 * 테마 관리
 */
export const theme = {
  /**
   * 현재 테마 가져오기
   * @returns {string}
   */
  getCurrent() {
    return document.body.getAttribute('data-theme') || 'light';
  },

  /**
   * 테마 설정
   * @param {string} themeName - 테마명
   */
  set(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    // 테마 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('theme:changed', {
      detail: { theme: themeName }
    }));
  },

  /**
   * 다크모드 토글
   */
  toggle() {
    const current = this.getCurrent();
    this.set(current === 'light' ? 'dark' : 'light');
  },

  /**
   * 시스템 테마 감지
   * @returns {string}
   */
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  /**
   * 시스템 테마 변경 감지
   * @param {Function} callback - 콜백 함수
   */
  watchSystemPreference(callback) {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        callback(e.matches ? 'dark' : 'light');
      });
    }
  }
};

/**
 * 모달 관리
 */
export const modal = {
  /**
   * 모달 열기
   * @param {string|Element} selector - 선택자 또는 요소
   * @param {Object} options - 옵션
   */
  open(selector, options = {}) {
    const element = typeof selector === 'string' ? 
      document.querySelector(selector) : selector;
    
    if (!element) return;

    const { 
      backdrop = true, 
      keyboard = true, 
      focus = true,
      onOpen,
      onClose 
    } = options;

    // 백드롭 추가
    if (backdrop) {
      this.createBackdrop(element, onClose);
    }

    // 키보드 이벤트
    if (keyboard) {
      this.bindKeyboard(element, onClose);
    }

    // 모달 표시
    element.classList.add('show');
    element.removeAttribute('hidden');
    
    // 포커스 설정
    if (focus) {
      const focusElement = element.querySelector('[autofocus]') || element;
      focusElement.focus();
    }

    // 스크롤 방지
    document.body.classList.add('modal-open');

    if (onOpen) onOpen(element);
  },

  /**
   * 모달 닫기
   * @param {string|Element} selector - 선택자 또는 요소
   * @param {Function} onClose - 닫기 콜백
   */
  close(selector, onClose) {
    const element = typeof selector === 'string' ? 
      document.querySelector(selector) : selector;
    
    if (!element) return;

    element.classList.remove('show');
    element.setAttribute('hidden', '');
    
    // 백드롭 제거
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    // 스크롤 복원
    document.body.classList.remove('modal-open');

    if (onClose) onClose(element);
  },

  /**
   * 백드롭 생성
   * @param {Element} modal - 모달 요소
   * @param {Function} onClose - 닫기 콜백
   * @private
   */
  createBackdrop(modal, onClose) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', () => {
      this.close(modal, onClose);
    });
    document.body.appendChild(backdrop);
  },

  /**
   * 키보드 이벤트 바인딩
   * @param {Element} modal - 모달 요소
   * @param {Function} onClose - 닫기 콜백
   * @private
   */
  bindKeyboard(modal, onClose) {
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this.close(modal, onClose);
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
  }
};

/**
 * 툴팁 관리
 */
export const tooltip = {
  /**
   * 툴팁 표시
   * @param {Element} element - 대상 요소
   * @param {string} content - 툴팁 내용
   * @param {Object} options - 옵션
   */
  show(element, content, options = {}) {
    const { position = 'top', delay = 0 } = options;

    setTimeout(() => {
      const tooltip = this.create(content, position);
      this.position(tooltip, element, position);
      document.body.appendChild(tooltip);

      // 애니메이션
      requestAnimationFrame(() => {
        tooltip.classList.add('show');
      });

      // 요소에 툴팁 참조 저장
      element._tooltip = tooltip;
    }, delay);
  },

  /**
   * 툴팁 숨기기
   * @param {Element} element - 대상 요소
   */
  hide(element) {
    const tooltip = element._tooltip;
    if (!tooltip) return;

    tooltip.classList.remove('show');
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      delete element._tooltip;
    }, 150);
  },

  /**
   * 툴팁 요소 생성
   * @param {string} content - 내용
   * @param {string} position - 위치
   * @returns {Element}
   * @private
   */
  create(content, position) {
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.innerHTML = `
      <div class="tooltip-arrow"></div>
      <div class="tooltip-content">${content}</div>
    `;
    return tooltip;
  },

  /**
   * 툴팁 위치 조정
   * @param {Element} tooltip - 툴팁 요소
   * @param {Element} target - 대상 요소
   * @param {string} position - 위치
   * @private
   */
  position(tooltip, target, position) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
        break;
    }

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
  }
};

/**
 * 스크롤 유틸리티
 */
export const scroll = {
  /**
   * 부드러운 스크롤
   * @param {Element|string} target - 대상 요소 또는 선택자
   * @param {Object} options - 옵션
   */
  to(target, options = {}) {
    const element = typeof target === 'string' ? 
      document.querySelector(target) : target;
    
    if (!element) return;

    const { offset = 0, duration = 500 } = options;
    const targetPosition = element.offsetTop - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    
    const startTime = performance.now();

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * 스크롤 위치 감지
   * @param {Function} callback - 콜백 함수
   * @param {Object} options - 옵션
   */
  watch(callback, options = {}) {
    const { throttle = 100 } = options;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback({
            scrollY: window.pageYOffset,
            scrollX: window.pageXOffset,
            direction: this.getDirection()
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  },

  /**
   * 스크롤 방향 가져오기
   * @returns {string}
   */
  getDirection() {
    const currentScroll = window.pageYOffset;
    const direction = currentScroll > (this.lastScroll || 0) ? 'down' : 'up';
    this.lastScroll = currentScroll;
    return direction;
  }
};
