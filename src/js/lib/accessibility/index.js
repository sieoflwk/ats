/**
 * @fileoverview 접근성 관련 유틸리티
 * WCAG 가이드라인 준수, 스크린 리더 지원, 키보드 네비게이션 등
 */

/**
 * 포커스 관리 유틸리티
 */
export const focus = {
  /**
   * 포커스 트랩 생성
   * @param {Element} container - 컨테이너 요소
   * @returns {Object}
   */
  createTrap(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    let isActive = false;

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll(focusableSelectors))
        .filter(el => {
          return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
        });
    };

    const handleTabKey = (e) => {
      if (!isActive || e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    return {
      activate() {
        isActive = true;
        document.addEventListener('keydown', handleTabKey);
        
        // 첫 번째 포커스 가능한 요소로 포커스 이동
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      },

      deactivate() {
        isActive = false;
        document.removeEventListener('keydown', handleTabKey);
      }
    };
  },

  /**
   * 요소로 포커스 이동
   * @param {Element|string} target - 대상 요소 또는 선택자
   * @param {Object} options - 옵션
   */
  moveTo(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const { preventScroll = false, delay = 0 } = options;

    setTimeout(() => {
      element.focus({ preventScroll });
      
      // 스크린 리더를 위한 공지
      if (element.getAttribute('aria-live') !== 'polite') {
        this.announce(`포커스가 ${element.textContent || element.getAttribute('aria-label') || '요소'}로 이동했습니다`);
      }
    }, delay);
  },

  /**
   * 이전에 포커스된 요소로 복원
   * @param {Element} previousElement - 이전 요소
   */
  restore(previousElement) {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },

  /**
   * 스크린 리더에게 메시지 전달
   * @param {string} message - 메시지
   * @param {string} priority - 우선순위 ('polite', 'assertive')
   */
  announce(message, priority = 'polite') {
    const announcer = document.getElementById('sr-announcer') || this.createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // 메시지 초기화 (재사용을 위해)
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  },

  /**
   * 스크린 리더 공지용 요소 생성
   * @returns {Element}
   * @private
   */
  createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0,0,0,0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }
};

/**
 * ARIA 속성 관리
 */
export const aria = {
  /**
   * ARIA 속성 설정
   * @param {Element} element - 요소
   * @param {Object} attributes - ARIA 속성들
   */
  setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
      element.setAttribute(ariaKey, value);
    });
  },

  /**
   * 확장/축소 상태 토글
   * @param {Element} trigger - 트리거 요소
   * @param {Element} target - 대상 요소
   */
  toggleExpanded(trigger, target) {
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    
    trigger.setAttribute('aria-expanded', newState);
    target.setAttribute('aria-hidden', !newState);
    
    if (newState) {
      target.removeAttribute('hidden');
    } else {
      target.setAttribute('hidden', '');
    }
  },

  /**
   * 선택 상태 설정
   * @param {Element} element - 요소
   * @param {boolean} selected - 선택 여부
   */
  setSelected(element, selected) {
    element.setAttribute('aria-selected', selected);
    
    if (selected) {
      element.setAttribute('tabindex', '0');
    } else {
      element.setAttribute('tabindex', '-1');
    }
  },

  /**
   * 비활성 상태 설정
   * @param {Element} element - 요소
   * @param {boolean} disabled - 비활성 여부
   */
  setDisabled(element, disabled) {
    element.setAttribute('aria-disabled', disabled);
    
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  },

  /**
   * 레이블 연결
   * @param {Element} element - 요소
   * @param {string} labelText - 레이블 텍스트
   * @param {string} type - 연결 타입 ('label', 'labelledby', 'describedby')
   */
  label(element, labelText, type = 'label') {
    switch (type) {
      case 'label':
        element.setAttribute('aria-label', labelText);
        break;
      case 'labelledby':
        const labelId = this.createLabel(labelText);
        element.setAttribute('aria-labelledby', labelId);
        break;
      case 'describedby':
        const descId = this.createDescription(labelText);
        element.setAttribute('aria-describedby', descId);
        break;
    }
  },

  /**
   * 레이블 요소 생성
   * @param {string} text - 텍스트
   * @returns {string}
   * @private
   */
  createLabel(text) {
    const id = `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const label = document.createElement('span');
    label.id = id;
    label.className = 'sr-only';
    label.textContent = text;
    document.body.appendChild(label);
    return id;
  },

  /**
   * 설명 요소 생성
   * @param {string} text - 텍스트
   * @returns {string}
   * @private
   */
  createDescription(text) {
    const id = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const desc = document.createElement('span');
    desc.id = id;
    desc.className = 'sr-only';
    desc.textContent = text;
    document.body.appendChild(desc);
    return id;
  }
};

/**
 * 키보드 네비게이션
 */
export const keyboard = {
  /**
   * 키보드 이벤트 핸들러 등록
   * @param {Element} element - 요소
   * @param {Object} keyMap - 키 맵
   * @param {Object} options - 옵션
   */
  bindKeys(element, keyMap, options = {}) {
    const { preventDefault = true, stopPropagation = false } = options;

    const handleKeyDown = (e) => {
      const key = e.key;
      const handler = keyMap[key];
      
      if (handler && typeof handler === 'function') {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        
        handler(e);
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    return () => element.removeEventListener('keydown', handleKeyDown);
  },

  /**
   * 화살표 키 네비게이션 설정
   * @param {Element[]} elements - 네비게이션할 요소들
   * @param {Object} options - 옵션
   */
  setupArrowNavigation(elements, options = {}) {
    const {
      orientation = 'both', // 'horizontal', 'vertical', 'both'
      loop = true,
      activateOnFocus = false
    } = options;

    let currentIndex = 0;

    elements.forEach((element, index) => {
      element.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      this.bindKeys(element, {
        ArrowUp: () => {
          if (orientation === 'horizontal') return;
          currentIndex = loop ? 
            (currentIndex - 1 + elements.length) % elements.length :
            Math.max(0, currentIndex - 1);
          this.focusElement(elements, currentIndex, activateOnFocus);
        },
        ArrowDown: () => {
          if (orientation === 'horizontal') return;
          currentIndex = loop ?
            (currentIndex + 1) % elements.length :
            Math.min(elements.length - 1, currentIndex + 1);
          this.focusElement(elements, currentIndex, activateOnFocus);
        },
        ArrowLeft: () => {
          if (orientation === 'vertical') return;
          currentIndex = loop ?
            (currentIndex - 1 + elements.length) % elements.length :
            Math.max(0, currentIndex - 1);
          this.focusElement(elements, currentIndex, activateOnFocus);
        },
        ArrowRight: () => {
          if (orientation === 'vertical') return;
          currentIndex = loop ?
            (currentIndex + 1) % elements.length :
            Math.min(elements.length - 1, currentIndex + 1);
          this.focusElement(elements, currentIndex, activateOnFocus);
        },
        Home: () => {
          currentIndex = 0;
          this.focusElement(elements, currentIndex, activateOnFocus);
        },
        End: () => {
          currentIndex = elements.length - 1;
          this.focusElement(elements, currentIndex, activateOnFocus);
        }
      });

      // 포커스 이벤트로 현재 인덱스 업데이트
      element.addEventListener('focus', () => {
        currentIndex = index;
      });
    });
  },

  /**
   * 요소에 포커스 및 활성화
   * @param {Element[]} elements - 요소들
   * @param {number} index - 인덱스
   * @param {boolean} activate - 활성화 여부
   * @private
   */
  focusElement(elements, index, activate) {
    elements.forEach((el, i) => {
      el.setAttribute('tabindex', i === index ? '0' : '-1');
      if (i === index) {
        el.focus();
        if (activate) {
          el.click();
        }
      }
    });
  },

  /**
   * 탭 순서 관리
   * @param {Element[]} elements - 요소들
   * @param {number[]} order - 탭 순서
   */
  setTabOrder(elements, order) {
    elements.forEach((element, index) => {
      const tabIndex = order[index] !== undefined ? order[index] : index + 1;
      element.setAttribute('tabindex', tabIndex);
    });
  }
};

/**
 * 색상 대비 검사
 */
export const contrast = {
  /**
   * 상대 광도 계산
   * @param {Array} rgb - RGB 값 [r, g, b]
   * @returns {number}
   * @private
   */
  getLuminance(rgb) {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * 대비율 계산
   * @param {Array} color1 - 첫 번째 색상 RGB
   * @param {Array} color2 - 두 번째 색상 RGB
   * @returns {number}
   */
  calculateRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * WCAG 대비 기준 확인
   * @param {number} ratio - 대비율
   * @param {string} level - WCAG 레벨 ('AA', 'AAA')
   * @param {string} size - 텍스트 크기 ('normal', 'large')
   * @returns {boolean}
   */
  meetsWCAG(ratio, level = 'AA', size = 'normal') {
    const requirements = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 }
    };
    
    return ratio >= requirements[level][size];
  },

  /**
   * 색상 문자열을 RGB로 변환
   * @param {string} color - 색상 문자열
   * @returns {Array|null}
   */
  parseColor(color) {
    // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
    const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgb) {
      return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
    }
    
    // 헥사 색상
    const hex = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hex) {
      return [
        parseInt(hex[1], 16),
        parseInt(hex[2], 16),
        parseInt(hex[3], 16)
      ];
    }
    
    return null;
  }
};

/**
 * 스크린 리더 지원
 */
export const screenReader = {
  /**
   * 라이브 리전 설정
   * @param {Element} element - 요소
   * @param {string} politeness - 예의 수준 ('polite', 'assertive', 'off')
   * @param {boolean} atomic - 원자적 업데이트 여부
   */
  setLiveRegion(element, politeness = 'polite', atomic = true) {
    element.setAttribute('aria-live', politeness);
    element.setAttribute('aria-atomic', atomic);
  },

  /**
   * 상태 변경 공지
   * @param {string} message - 메시지
   * @param {string} type - 타입 ('status', 'alert', 'log')
   */
  announceStatus(message, type = 'status') {
    const roleMap = {
      status: 'status',
      alert: 'alert',
      log: 'log'
    };
    
    const announcer = document.createElement('div');
    announcer.setAttribute('role', roleMap[type] || 'status');
    announcer.setAttribute('aria-live', type === 'alert' ? 'assertive' : 'polite');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * 페이지 구조 정보 설정
   * @param {Element} element - 요소
   * @param {Object} structure - 구조 정보
   */
  setStructure(element, structure) {
    const { level, setSize, positionInSet, label } = structure;
    
    if (level) element.setAttribute('aria-level', level);
    if (setSize) element.setAttribute('aria-setsize', setSize);
    if (positionInSet) element.setAttribute('aria-posinset', positionInSet);
    if (label) element.setAttribute('aria-label', label);
  }
};

/**
 * 모션 감소 지원
 */
export const reducedMotion = {
  /**
   * 모션 감소 설정 확인
   * @returns {boolean}
   */
  isPreferred() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * 모션 감소 변경 감지
   * @param {Function} callback - 콜백 함수
   */
  onChange(callback) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', callback);
    
    return () => mediaQuery.removeEventListener('change', callback);
  },

  /**
   * 애니메이션 적용 (모션 감소 고려)
   * @param {Element} element - 요소
   * @param {Object} animation - 애니메이션 설정
   * @param {Object} reducedAnimation - 감소된 애니메이션 설정
   */
  animate(element, animation, reducedAnimation = {}) {
    const useReduced = this.isPreferred();
    const config = useReduced ? { ...animation, ...reducedAnimation } : animation;
    
    if (useReduced) {
      // 모션 감소 시 즉시 최종 상태로
      Object.assign(element.style, config.to || {});
    } else {
      // 일반 애니메이션
      element.animate(config.keyframes, config.options);
    }
  }
};

/**
 * 접근성 검사 도구
 */
export const audit = {
  /**
   * 기본 접근성 검사
   * @param {Element} container - 검사할 컨테이너
   * @returns {Object}
   */
  checkBasics(container = document) {
    const issues = [];

    // 이미지 alt 속성 검사
    const images = container.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'missing-alt',
          element: img,
          message: `Image ${index + 1} is missing alt attribute`
        });
      }
    });

    // 폼 레이블 검사
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const id = input.id;
      const label = id ? container.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'missing-label',
          element: input,
          message: `Form control ${index + 1} is missing a label`
        });
      }
    });

    // 헤딩 구조 검사
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        issues.push({
          type: 'heading-skip',
          element: heading,
          message: `Heading ${index + 1} skips levels (from h${previousLevel} to h${level})`
        });
      }
      
      previousLevel = level;
    });

    return {
      total: issues.length,
      issues
    };
  },

  /**
   * 색상 대비 검사
   * @param {Element} container - 검사할 컨테이너
   * @returns {Array}
   */
  checkColorContrast(container = document) {
    const issues = [];
    const textElements = container.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
    
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = contrast.parseColor(style.color);
      const backgroundColor = contrast.parseColor(style.backgroundColor);
      
      if (color && backgroundColor) {
        const ratio = contrast.calculateRatio(color, backgroundColor);
        
        if (!contrast.meetsWCAG(ratio, 'AA', 'normal')) {
          issues.push({
            type: 'low-contrast',
            element,
            ratio: ratio.toFixed(2),
            message: `Text has insufficient color contrast (${ratio.toFixed(2)}:1)`
          });
        }
      }
    });
    
    return issues;
  }
};

/**
 * 초기화 함수
 * @param {Object} options - 옵션
 */
export function initialize(options = {}) {
  const {
    focusManagement = true,
    announcer = true,
    keyboardNavigation = true,
    reducedMotionSupport = true
  } = options;

  // 포커스 관리 설정
  if (focusManagement) {
    document.addEventListener('focusin', (e) => {
      e.target.classList.add('focus-visible');
    });
    
    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('focus-visible');
    });
  }

  // 스크린 리더 공지용 요소 생성
  if (announcer) {
    focus.createAnnouncer();
  }

  // 키보드 네비게이션 향상
  if (keyboardNavigation) {
    // Skip link 생성
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = '메인 콘텐츠로 건너뛰기';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // 모션 감소 지원
  if (reducedMotionSupport) {
    if (reducedMotion.isPreferred()) {
      document.body.classList.add('reduce-motion');
    }
    
    reducedMotion.onChange((e) => {
      document.body.classList.toggle('reduce-motion', e.matches);
    });
  }

  return {
    focus,
    aria,
    keyboard,
    contrast,
    screenReader,
    reducedMotion,
    audit
  };
}
