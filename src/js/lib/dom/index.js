/**
 * @fileoverview DOM 조작 유틸리티 통합
 * 자주 사용되는 DOM 조작 기능들을 효율적으로 제공
 */

/**
 * 요소 선택 유틸리티
 */
export const select = {
  /**
   * 단일 요소 선택
   * @param {string} selector - CSS 선택자
   * @param {Element} [context=document] - 컨텍스트
   * @returns {Element|null}
   */
  one(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * 다중 요소 선택
   * @param {string} selector - CSS 선택자
   * @param {Element} [context=document] - 컨텍스트
   * @returns {Element[]}
   */
  all(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  /**
   * ID로 요소 선택
   * @param {string} id - 요소 ID
   * @returns {Element|null}
   */
  id(id) {
    return document.getElementById(id);
  },

  /**
   * 클래스로 요소 선택
   * @param {string} className - 클래스명
   * @param {Element} [context=document] - 컨텍스트
   * @returns {Element[]}
   */
  class(className, context = document) {
    return Array.from(context.getElementsByClassName(className));
  },

  /**
   * 태그로 요소 선택
   * @param {string} tagName - 태그명
   * @param {Element} [context=document] - 컨텍스트
   * @returns {Element[]}
   */
  tag(tagName, context = document) {
    return Array.from(context.getElementsByTagName(tagName));
  },

  /**
   * 가장 가까운 상위 요소 찾기
   * @param {Element} element - 시작 요소
   * @param {string} selector - CSS 선택자
   * @returns {Element|null}
   */
  closest(element, selector) {
    return element?.closest(selector) || null;
  },

  /**
   * 다음/이전 형제 요소
   * @param {Element} element - 기준 요소
   * @param {string} [selector] - 선택자 (선택적)
   * @returns {Element|null}
   */
  next(element, selector) {
    let sibling = element?.nextElementSibling;
    while (sibling && selector && !sibling.matches(selector)) {
      sibling = sibling.nextElementSibling;
    }
    return sibling;
  },

  prev(element, selector) {
    let sibling = element?.previousElementSibling;
    while (sibling && selector && !sibling.matches(selector)) {
      sibling = sibling.previousElementSibling;
    }
    return sibling;
  }
};

/**
 * 요소 생성 유틸리티
 */
export const create = {
  /**
   * 요소 생성
   * @param {string} tagName - 태그명
   * @param {Object} [options] - 옵션
   * @param {string} [options.className] - 클래스명
   * @param {string} [options.id] - ID
   * @param {string} [options.textContent] - 텍스트 내용
   * @param {string} [options.innerHTML] - HTML 내용
   * @param {Object} [options.attributes] - 속성들
   * @param {Object} [options.data] - 데이터 속성들
   * @param {Object} [options.style] - 인라인 스타일
   * @returns {Element}
   */
  element(tagName, options = {}) {
    const element = document.createElement(tagName);
    
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.data) {
      Object.entries(options.data).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
    
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    
    return element;
  },

  /**
   * 텍스트 노드 생성
   * @param {string} text - 텍스트
   * @returns {Text}
   */
  text(text) {
    return document.createTextNode(text);
  },

  /**
   * DocumentFragment 생성
   * @returns {DocumentFragment}
   */
  fragment() {
    return document.createDocumentFragment();
  },

  /**
   * HTML 문자열에서 요소 생성
   * @param {string} html - HTML 문자열
   * @returns {Element[]}
   */
  fromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return Array.from(template.content.children);
  },

  /**
   * 템플릿 복제
   * @param {string} templateId - 템플릿 ID
   * @param {boolean} [deep=true] - 깊은 복사
   * @returns {DocumentFragment}
   */
  fromTemplate(templateId, deep = true) {
    const template = document.getElementById(templateId);
    if (!template || template.tagName !== 'TEMPLATE') {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template.content.cloneNode(deep);
  }
};

/**
 * 클래스 조작 유틸리티
 */
export const css = {
  /**
   * 클래스 추가
   * @param {Element|Element[]} elements - 요소(들)
   * @param {...string} classNames - 클래스명들
   */
  add(elements, ...classNames) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => el?.classList.add(...classNames));
  },

  /**
   * 클래스 제거
   * @param {Element|Element[]} elements - 요소(들)
   * @param {...string} classNames - 클래스명들
   */
  remove(elements, ...classNames) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => el?.classList.remove(...classNames));
  },

  /**
   * 클래스 토글
   * @param {Element|Element[]} elements - 요소(들)
   * @param {string} className - 클래스명
   * @param {boolean} [force] - 강제 설정
   */
  toggle(elements, className, force) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => el?.classList.toggle(className, force));
  },

  /**
   * 클래스 존재 확인
   * @param {Element} element - 요소
   * @param {string} className - 클래스명
   * @returns {boolean}
   */
  has(element, className) {
    return element?.classList.contains(className) || false;
  },

  /**
   * 클래스 교체
   * @param {Element|Element[]} elements - 요소(들)
   * @param {string} oldClass - 기존 클래스
   * @param {string} newClass - 새 클래스
   */
  replace(elements, oldClass, newClass) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => el?.classList.replace(oldClass, newClass));
  }
};

/**
 * 속성 조작 유틸리티
 */
export const attr = {
  /**
   * 속성 설정
   * @param {Element} element - 요소
   * @param {string|Object} name - 속성명 또는 속성 객체
   * @param {string} [value] - 속성값
   */
  set(element, name, value) {
    if (!element) return;
    
    if (typeof name === 'object') {
      Object.entries(name).forEach(([key, val]) => {
        element.setAttribute(key, val);
      });
    } else {
      element.setAttribute(name, value);
    }
  },

  /**
   * 속성 가져오기
   * @param {Element} element - 요소
   * @param {string} name - 속성명
   * @returns {string|null}
   */
  get(element, name) {
    return element?.getAttribute(name) || null;
  },

  /**
   * 속성 제거
   * @param {Element} element - 요소
   * @param {...string} names - 속성명들
   */
  remove(element, ...names) {
    if (!element) return;
    names.forEach(name => element.removeAttribute(name));
  },

  /**
   * 속성 존재 확인
   * @param {Element} element - 요소
   * @param {string} name - 속성명
   * @returns {boolean}
   */
  has(element, name) {
    return element?.hasAttribute(name) || false;
  },

  /**
   * 데이터 속성 설정
   * @param {Element} element - 요소
   * @param {string|Object} name - 데이터 키 또는 데이터 객체
   * @param {any} [value] - 값
   */
  data(element, name, value) {
    if (!element) return;
    
    if (arguments.length === 2 && typeof name === 'string') {
      return element.dataset[name];
    }
    
    if (typeof name === 'object') {
      Object.entries(name).forEach(([key, val]) => {
        element.dataset[key] = val;
      });
    } else {
      element.dataset[name] = value;
    }
  }
};

/**
 * 스타일 조작 유틸리티
 */
export const style = {
  /**
   * 스타일 설정
   * @param {Element} element - 요소
   * @param {string|Object} property - 속성명 또는 스타일 객체
   * @param {string} [value] - 속성값
   */
  set(element, property, value) {
    if (!element) return;
    
    if (typeof property === 'object') {
      Object.assign(element.style, property);
    } else {
      element.style[property] = value;
    }
  },

  /**
   * 계산된 스타일 가져오기
   * @param {Element} element - 요소
   * @param {string} property - 속성명
   * @returns {string}
   */
  get(element, property) {
    if (!element) return '';
    return window.getComputedStyle(element)[property];
  },

  /**
   * 스타일 제거
   * @param {Element} element - 요소
   * @param {...string} properties - 속성명들
   */
  remove(element, ...properties) {
    if (!element) return;
    properties.forEach(prop => element.style.removeProperty(prop));
  },

  /**
   * 요소 숨기기/보이기
   * @param {Element|Element[]} elements - 요소(들)
   * @param {boolean} [visible=true] - 보이기 여부
   */
  show(elements, visible = true) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => {
      if (el) el.style.display = visible ? '' : 'none';
    });
  },

  /**
   * 요소 숨기기
   * @param {Element|Element[]} elements - 요소(들)
   */
  hide(elements) {
    this.show(elements, false);
  },

  /**
   * 불투명도 설정
   * @param {Element|Element[]} elements - 요소(들)
   * @param {number} opacity - 불투명도 (0-1)
   */
  opacity(elements, opacity) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    elementArray.forEach(el => {
      if (el) el.style.opacity = opacity;
    });
  }
};

/**
 * 이벤트 유틸리티
 */
export const events = {
  /**
   * 이벤트 리스너 추가
   * @param {Element|Element[]|string} target - 대상 또는 선택자
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러
   * @param {Object|boolean} [options] - 옵션
   * @returns {Function} 제거 함수
   */
  on(target, event, handler, options) {
    const elements = typeof target === 'string' ? 
      select.all(target) : 
      Array.isArray(target) ? target : [target];
    
    elements.forEach(el => el.addEventListener(event, handler, options));
    
    return () => this.off(elements, event, handler);
  },

  /**
   * 이벤트 리스너 제거
   * @param {Element|Element[]|string} target - 대상 또는 선택자
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러
   */
  off(target, event, handler) {
    const elements = typeof target === 'string' ? 
      select.all(target) : 
      Array.isArray(target) ? target : [target];
    
    elements.forEach(el => el.removeEventListener(event, handler));
  },

  /**
   * 일회성 이벤트 리스너
   * @param {Element|string} target - 대상 또는 선택자
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러
   * @returns {Promise}
   */
  once(target, event, handler) {
    return new Promise(resolve => {
      const element = typeof target === 'string' ? select.one(target) : target;
      
      const wrappedHandler = (e) => {
        if (handler) handler(e);
        resolve(e);
      };
      
      element.addEventListener(event, wrappedHandler, { once: true });
    });
  },

  /**
   * 이벤트 위임
   * @param {Element|string} container - 컨테이너 또는 선택자
   * @param {string} selector - 대상 선택자
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러
   * @returns {Function} 제거 함수
   */
  delegate(container, selector, event, handler) {
    const element = typeof container === 'string' ? select.one(container) : container;
    
    const delegatedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && element.contains(target)) {
        handler.call(target, e);
      }
    };
    
    element.addEventListener(event, delegatedHandler);
    
    return () => element.removeEventListener(event, delegatedHandler);
  },

  /**
   * 커스텀 이벤트 발생
   * @param {Element|string} target - 대상 또는 선택자
   * @param {string} eventName - 이벤트명
   * @param {Object} [detail] - 이벤트 데이터
   * @param {Object} [options] - 이벤트 옵션
   */
  trigger(target, eventName, detail, options = {}) {
    const element = typeof target === 'string' ? select.one(target) : target;
    if (!element) return;
    
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(event);
  }
};

/**
 * 위치 및 크기 유틸리티
 */
export const geometry = {
  /**
   * 요소의 위치 정보
   * @param {Element} element - 요소
   * @returns {DOMRect}
   */
  rect(element) {
    return element?.getBoundingClientRect() || null;
  },

  /**
   * 요소의 오프셋 정보
   * @param {Element} element - 요소
   * @returns {Object}
   */
  offset(element) {
    if (!element) return { top: 0, left: 0 };
    
    return {
      top: element.offsetTop,
      left: element.offsetLeft,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  },

  /**
   * 뷰포트 내 위치 확인
   * @param {Element} element - 요소
   * @param {number} [threshold=0] - 임계값 (0-1)
   * @returns {boolean}
   */
  inViewport(element, threshold = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    const verticalVisible = rect.top < windowHeight && rect.bottom > 0;
    const horizontalVisible = rect.left < windowWidth && rect.right > 0;
    
    if (threshold === 0) {
      return verticalVisible && horizontalVisible;
    }
    
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    const visibleArea = visibleHeight * visibleWidth;
    const totalArea = rect.width * rect.height;
    
    return (visibleArea / totalArea) >= threshold;
  },

  /**
   * 요소까지 스크롤
   * @param {Element|string} target - 대상 또는 선택자
   * @param {Object} [options] - 스크롤 옵션
   */
  scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? select.one(target) : target;
    if (!element) return;
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options
    });
  }
};

/**
 * DOM 조작 유틸리티
 */
export const manipulate = {
  /**
   * 요소 추가
   * @param {Element} parent - 부모 요소
   * @param {Element|Element[]|string} children - 자식 요소(들) 또는 HTML
   * @param {string} [position='beforeend'] - 위치
   */
  append(parent, children, position = 'beforeend') {
    if (!parent) return;
    
    if (typeof children === 'string') {
      parent.insertAdjacentHTML(position, children);
    } else {
      const childArray = Array.isArray(children) ? children : [children];
      childArray.forEach(child => {
        if (child instanceof Node) {
          if (position === 'beforeend') {
            parent.appendChild(child);
          } else if (position === 'afterbegin') {
            parent.insertBefore(child, parent.firstChild);
          }
        }
      });
    }
  },

  /**
   * 요소 제거
   * @param {Element|Element[]|string} elements - 요소(들) 또는 선택자
   */
  remove(elements) {
    const elementArray = typeof elements === 'string' ? 
      select.all(elements) : 
      Array.isArray(elements) ? elements : [elements];
    
    elementArray.forEach(el => el?.remove());
  },

  /**
   * 요소 교체
   * @param {Element} oldElement - 기존 요소
   * @param {Element} newElement - 새 요소
   */
  replace(oldElement, newElement) {
    if (oldElement && newElement) {
      oldElement.parentNode?.replaceChild(newElement, oldElement);
    }
  },

  /**
   * 요소 복제
   * @param {Element} element - 요소
   * @param {boolean} [deep=true] - 깊은 복사
   * @returns {Element}
   */
  clone(element, deep = true) {
    return element?.cloneNode(deep) || null;
  },

  /**
   * 빈 요소로 만들기
   * @param {Element|Element[]|string} elements - 요소(들) 또는 선택자
   */
  empty(elements) {
    const elementArray = typeof elements === 'string' ? 
      select.all(elements) : 
      Array.isArray(elements) ? elements : [elements];
    
    elementArray.forEach(el => {
      if (el) el.innerHTML = '';
    });
  }
};

/**
 * DOM 준비 상태 확인
 * @param {Function} callback - 실행할 함수
 */
export function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * 요소 존재 확인
 * @param {Element|string} element - 요소 또는 선택자
 * @returns {boolean}
 */
export function exists(element) {
  if (typeof element === 'string') {
    return select.one(element) !== null;
  }
  return element instanceof Element;
}

/**
 * 요소 포커스 설정
 * @param {Element|string} element - 요소 또는 선택자
 * @param {Object} [options] - 포커스 옵션
 */
export function focus(element, options = {}) {
  const el = typeof element === 'string' ? select.one(element) : element;
  if (el && typeof el.focus === 'function') {
    el.focus(options);
  }
}

/**
 * HTML 이스케이프
 * @param {string} html - HTML 문자열
 * @returns {string}
 */
export function escapeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * HTML 언이스케이프
 * @param {string} html - 이스케이프된 HTML
 * @returns {string}
 */
export function unescapeHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
