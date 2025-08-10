/**
 * 접근성(A11y) 유틸리티
 */

// 포커스 관리
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapElement = null;
  }

  // 포커스 가능한 요소들 선택자
  get focusableSelectors() {
    return [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
  }

  // 포커스 가능한 요소들 찾기
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(el => this.isVisible(el));
  }

  // 요소가 보이는지 확인
  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  // 포커스 트랩 설정 (모달용)
  trapFocus(element) {
    this.trapElement = element;
    const focusableElements = this.getFocusableElements(element);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

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

    element.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
      this.trapElement = null;
    };
  }

  // 포커스 저장 및 복원
  saveFocus() {
    this.focusStack.push(document.activeElement);
  }

  restoreFocus() {
    const element = this.focusStack.pop();
    if (element && this.isVisible(element)) {
      element.focus();
    }
  }

  // 스킵 링크 추가
  addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">메인 콘텐츠로 이동</a>
      <a href="#navigation" class="skip-link">내비게이션으로 이동</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }
}

// 스크린 리더 전용 텍스트
export function createSROnlyText(text) {
  const element = document.createElement('span');
  element.className = 'sr-only';
  element.textContent = text;
  return element;
}

// 라이브 리전 관리
export class LiveRegion {
  constructor() {
    this.regions = new Map();
    this.createDefaultRegions();
  }

  createDefaultRegions() {
    // 정중한 알림용
    this.createRegion('polite', 'polite');
    // 긴급 알림용
    this.createRegion('assertive', 'assertive');
    // 상태 변경용
    this.createRegion('status', 'polite');
  }

  createRegion(id, politeness = 'polite') {
    const region = document.createElement('div');
    region.id = `live-region-${id}`;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    
    document.body.appendChild(region);
    this.regions.set(id, region);
    
    return region;
  }

  announce(message, regionId = 'polite') {
    const region = this.regions.get(regionId);
    if (region) {
      // 기존 내용을 지우고 새 메시지 설정
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  clear(regionId) {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }
}

// ARIA 속성 관리
export class AriaManager {
  // 확장/축소 상태 토글
  static toggleExpanded(button, target) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    
    if (target) {
      target.setAttribute('aria-hidden', isExpanded);
    }
  }

  // 선택 상태 설정
  static setSelected(element, selected = true) {
    element.setAttribute('aria-selected', selected);
    
    // 같은 그룹의 다른 요소들 선택 해제
    const group = element.closest('[role="tablist"], [role="listbox"], [role="grid"]');
    if (group) {
      group.querySelectorAll('[aria-selected="true"]').forEach(el => {
        if (el !== element) {
          el.setAttribute('aria-selected', 'false');
        }
      });
    }
  }

  // 체크 상태 설정
  static setChecked(element, checked = true) {
    element.setAttribute('aria-checked', checked);
  }

  // 비활성 상태 설정
  static setDisabled(element, disabled = true) {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('aria-disabled');
      element.removeAttribute('tabindex');
    }
  }

  // 로딩 상태 설정
  static setBusy(element, busy = true) {
    element.setAttribute('aria-busy', busy);
  }

  // 유효성 상태 설정
  static setInvalid(element, invalid = true, errorId = null) {
    element.setAttribute('aria-invalid', invalid);
    
    if (invalid && errorId) {
      element.setAttribute('aria-describedby', errorId);
    } else if (!invalid) {
      element.removeAttribute('aria-describedby');
    }
  }
}

// 키보드 내비게이션
export class KeyboardNavigation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      wrap: true,
      orientation: 'horizontal', // horizontal, vertical, both
      selector: '[role="button"], [role="tab"], [role="menuitem"]',
      ...options
    };
    
    this.items = [];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    this.updateItems();
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 동적 변경 감지
    const observer = new MutationObserver(() => this.updateItems());
    observer.observe(this.container, { childList: true, subtree: true });
  }

  updateItems() {
    this.items = Array.from(this.container.querySelectorAll(this.options.selector))
      .filter(item => !item.hasAttribute('aria-disabled'));
    
    // 현재 포커스된 아이템 인덱스 업데이트
    const focusedItem = this.items.find(item => item === document.activeElement);
    if (focusedItem) {
      this.currentIndex = this.items.indexOf(focusedItem);
    }
  }

  handleKeyDown(e) {
    if (this.items.length === 0) return;

    let newIndex = this.currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowRight':
        if (this.options.orientation === 'horizontal' || this.options.orientation === 'both') {
          newIndex = this.getNextIndex(1);
          handled = true;
        }
        break;
        
      case 'ArrowLeft':
        if (this.options.orientation === 'horizontal' || this.options.orientation === 'both') {
          newIndex = this.getNextIndex(-1);
          handled = true;
        }
        break;
        
      case 'ArrowDown':
        if (this.options.orientation === 'vertical' || this.options.orientation === 'both') {
          newIndex = this.getNextIndex(1);
          handled = true;
        }
        break;
        
      case 'ArrowUp':
        if (this.options.orientation === 'vertical' || this.options.orientation === 'both') {
          newIndex = this.getNextIndex(-1);
          handled = true;
        }
        break;
        
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
        
      case 'End':
        newIndex = this.items.length - 1;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.focusItem(newIndex);
    }
  }

  getNextIndex(direction) {
    let newIndex = this.currentIndex + direction;
    
    if (this.options.wrap) {
      if (newIndex < 0) {
        newIndex = this.items.length - 1;
      } else if (newIndex >= this.items.length) {
        newIndex = 0;
      }
    } else {
      newIndex = Math.max(0, Math.min(this.items.length - 1, newIndex));
    }
    
    return newIndex;
  }

  focusItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.items[index].focus();
    }
  }
}

// 색상 대비 검사
export function checkColorContrast(foreground, background) {
  // RGB 값을 상대적 밝기로 변환
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // 색상 문자열을 RGB로 파싱
  function parseColor(color) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  }

  const fg = parseColor(foreground);
  const bg = parseColor(background);
  
  const fgLum = getLuminance(fg.r, fg.g, fg.b);
  const bgLum = getLuminance(bg.r, bg.g, bg.b);
  
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  return {
    ratio: ratio,
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AA_large: ratio >= 3,
    AAA_large: ratio >= 4.5
  };
}

// 폰트 크기 조절
export function setupFontSizeControls() {
  const fontSizes = ['small', 'medium', 'large', 'extra-large'];
  let currentSizeIndex = 1; // medium

  function updateFontSize() {
    document.documentElement.setAttribute('data-font-size', fontSizes[currentSizeIndex]);
    localStorage.setItem('preferred-font-size', fontSizes[currentSizeIndex]);
  }

  // 저장된 설정 로드
  const saved = localStorage.getItem('preferred-font-size');
  if (saved && fontSizes.includes(saved)) {
    currentSizeIndex = fontSizes.indexOf(saved);
    updateFontSize();
  }

  // 컨트롤 생성
  const controls = document.createElement('div');
  controls.className = 'font-size-controls';
  controls.innerHTML = `
    <button type="button" aria-label="글씨 크기 감소" data-action="decrease">A-</button>
    <button type="button" aria-label="글씨 크기 증가" data-action="increase">A+</button>
    <button type="button" aria-label="글씨 크기 초기화" data-action="reset">A</button>
  `;

  controls.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    
    switch (action) {
      case 'decrease':
        if (currentSizeIndex > 0) {
          currentSizeIndex--;
          updateFontSize();
        }
        break;
      case 'increase':
        if (currentSizeIndex < fontSizes.length - 1) {
          currentSizeIndex++;
          updateFontSize();
        }
        break;
      case 'reset':
        currentSizeIndex = 1;
        updateFontSize();
        break;
    }
  });

  return controls;
}

// 전역 접근성 초기화
export function initializeAccessibility() {
  const focusManager = new FocusManager();
  const liveRegion = new LiveRegion();
  
  // 스킵 링크 추가
  focusManager.addSkipLinks();
  
  // 키보드 포커스 표시 개선
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // 전역 단축키
  document.addEventListener('keydown', (e) => {
    // Alt + 1: 메인 콘텐츠로 이동
    if (e.altKey && e.key === '1') {
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) main.focus();
    }
    
    // Alt + 2: 내비게이션으로 이동
    if (e.altKey && e.key === '2') {
      e.preventDefault();
      const nav = document.querySelector('nav, [role="navigation"]');
      if (nav) nav.focus();
    }
  });

  return { focusManager, liveRegion };
}
