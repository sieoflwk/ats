/**
 * @fileoverview 지연 로딩 시스템
 * 컴포넌트, 이미지, 스크립트의 지연 로딩을 관리
 */

/**
 * @typedef {Object} LazyLoadOptions
 * @property {number} [threshold=0.1] - 교차 임계값
 * @property {string} [rootMargin='0px'] - 루트 마진
 * @property {boolean} [once=true] - 한 번만 로드
 * @property {Function} [onLoad] - 로드 완료 콜백
 * @property {Function} [onError] - 에러 콜백
 */

/**
 * 지연 로딩 관리자
 */
export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      threshold: 0.1,
      rootMargin: '0px',
      once: true,
      ...options
    };

    /** @type {Map<Element, LazyLoadOptions>} */
    this.elements = new Map();
    
    /** @type {IntersectionObserver|null} */
    this.observer = null;

    /** @type {Map<string, Promise>} */
    this.moduleCache = new Map();

    this.init();
  }

  /**
   * Intersection Observer 초기화
   * @private
   */
  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      return;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );
  }

  /**
   * 교차 이벤트 처리
   * @param {IntersectionObserverEntry[]} entries - 교차 엔트리들
   * @private
   */
  handleIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const element = entry.target;
        const options = this.elements.get(element);
        
        if (options) {
          this.loadElement(element, options);
          
          if (options.once !== false) {
            this.unobserve(element);
          }
        }
      }
    }
  }

  /**
   * 요소를 지연 로딩 대상으로 등록
   * @param {Element|string} element - 요소 또는 선택자
   * @param {LazyLoadOptions} [options] - 옵션
   */
  observe(element, options = {}) {
    const el = typeof element === 'string' ? 
      document.querySelector(element) : element;
    
    if (!el) {
      console.warn('Element not found for lazy loading');
      return;
    }

    // 이미 관찰 중인 요소 확인
    if (this.elements.has(el)) {
      return;
    }

    const mergedOptions = { ...this.options, ...options };
    this.elements.set(el, mergedOptions);

    if (this.observer) {
      this.observer.observe(el);
    } else {
      // Intersection Observer 미지원 시 즉시 로드
      this.loadElement(el, mergedOptions);
    }
  }

  /**
   * 요소 관찰 중지
   * @param {Element} element - 요소
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.elements.delete(element);
  }

  /**
   * 요소 로딩 실행
   * @param {Element} element - 요소
   * @param {LazyLoadOptions} options - 옵션
   * @private
   */
  async loadElement(element, options) {
    try {
      // 이미지 지연 로딩
      if (element.tagName === 'IMG') {
        await this.loadImage(element);
      }
      // 컴포넌트 지연 로딩
      else if (element.hasAttribute('data-component')) {
        await this.loadComponent(element);
      }
      // 스크립트 지연 로딩
      else if (element.tagName === 'SCRIPT') {
        await this.loadScript(element);
      }
      // 커스텀 로더
      else if (options.loader) {
        await options.loader(element);
      }

      // 성공 콜백
      if (options.onLoad) {
        options.onLoad(element);
      }

    } catch (error) {
      console.error('Lazy loading failed:', error);
      
      if (options.onError) {
        options.onError(error, element);
      }
    }
  }

  /**
   * 이미지 지연 로딩
   * @param {HTMLImageElement} img - 이미지 요소
   * @returns {Promise<void>}
   * @private
   */
  loadImage(img) {
    return new Promise((resolve, reject) => {
      const src = img.dataset.src || img.dataset.lazySrc;
      const srcset = img.dataset.srcset || img.dataset.lazySrcset;

      if (!src && !srcset) {
        reject(new Error('No lazy source found'));
        return;
      }

      // 로딩 중 표시
      img.classList.add('lazy-loading');

      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = src || tempImg.src;
        if (srcset) img.srcset = srcset;
        
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        
        resolve();
      };

      tempImg.onerror = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        reject(new Error('Image loading failed'));
      };

      if (src) tempImg.src = src;
    });
  }

  /**
   * 컴포넌트 지연 로딩
   * @param {Element} element - 요소
   * @returns {Promise<void>}
   * @private
   */
  async loadComponent(element) {
    const componentName = element.dataset.component;
    const componentPath = element.dataset.componentPath;

    if (!componentName) {
      throw new Error('Component name not specified');
    }

    try {
      // 로딩 중 표시
      element.classList.add('component-loading');

      // 컴포넌트 모듈 로드
      const ComponentClass = await this.loadModule(componentPath || `./components/${componentName}.js`);
      
      // 컴포넌트 인스턴스 생성
      const options = element.dataset.componentOptions ? 
        JSON.parse(element.dataset.componentOptions) : {};
      
      const instance = new ComponentClass(element, options);
      
      // 초기화
      if (typeof instance.init === 'function') {
        await instance.init();
      }

      // 요소에 인스턴스 저장
      element._componentInstance = instance;
      
      element.classList.remove('component-loading');
      element.classList.add('component-loaded');

    } catch (error) {
      element.classList.remove('component-loading');
      element.classList.add('component-error');
      throw error;
    }
  }

  /**
   * 스크립트 지연 로딩
   * @param {HTMLScriptElement} script - 스크립트 요소
   * @returns {Promise<void>}
   * @private
   */
  loadScript(script) {
    return new Promise((resolve, reject) => {
      const src = script.dataset.src || script.dataset.lazySrc;
      
      if (!src) {
        reject(new Error('No script source found'));
        return;
      }

      const newScript = document.createElement('script');
      newScript.src = src;
      newScript.async = true;

      newScript.onload = () => {
        script.classList.add('script-loaded');
        resolve();
      };

      newScript.onerror = () => {
        script.classList.add('script-error');
        reject(new Error('Script loading failed'));
      };

      document.head.appendChild(newScript);
    });
  }

  /**
   * 모듈 지연 로딩 (캐시 포함)
   * @param {string} modulePath - 모듈 경로
   * @returns {Promise<any>}
   */
  async loadModule(modulePath) {
    // 캐시 확인
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }

    // 모듈 로드
    const modulePromise = import(modulePath).then(module => {
      return module.default || module;
    });

    // 캐시에 저장
    this.moduleCache.set(modulePath, modulePromise);

    return modulePromise;
  }

  /**
   * 여러 요소를 일괄 등록
   * @param {string} selector - CSS 선택자
   * @param {LazyLoadOptions} [options] - 옵션
   */
  observeAll(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => this.observe(element, options));
  }

  /**
   * 특정 조건 하에서 지연 로딩
   * @param {Element|string} element - 요소 또는 선택자
   * @param {Function} condition - 조건 함수
   * @param {LazyLoadOptions} [options] - 옵션
   */
  observeWhen(element, condition, options = {}) {
    const checkCondition = () => {
      if (condition()) {
        this.observe(element, options);
      } else {
        requestAnimationFrame(checkCondition);
      }
    };

    checkCondition();
  }

  /**
   * 우선순위에 따른 지연 로딩
   * @param {Array<{element: Element, priority: number, options?: LazyLoadOptions}>} items - 아이템들
   */
  observeWithPriority(items) {
    // 우선순위로 정렬
    const sortedItems = items.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // 순차적으로 로딩
    let delay = 0;
    sortedItems.forEach((item, index) => {
      setTimeout(() => {
        this.observe(item.element, item.options);
      }, delay);
      
      delay += 100; // 100ms 간격
    });
  }

  /**
   * 네트워크 상태에 따른 적응형 로딩
   * @param {Element|string} element - 요소 또는 선택자
   * @param {Object} strategies - 전략 객체
   * @param {LazyLoadOptions} strategies.fast - 빠른 네트워크용 옵션
   * @param {LazyLoadOptions} strategies.slow - 느린 네트워크용 옵션
   */
  observeAdaptive(element, strategies) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    let options = strategies.fast || {};
    
    if (connection) {
      // 느린 연결 감지
      if (connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.saveData) {
        options = strategies.slow || options;
      }
    }

    this.observe(element, options);
  }

  /**
   * 지연 로딩 상태 확인
   * @param {Element} element - 요소
   * @returns {string|null} 상태 ('pending'|'loading'|'loaded'|'error'|null)
   */
  getLoadingState(element) {
    if (!this.elements.has(element)) {
      return null;
    }

    if (element.classList.contains('lazy-loading') || 
        element.classList.contains('component-loading')) {
      return 'loading';
    }

    if (element.classList.contains('lazy-loaded') || 
        element.classList.contains('component-loaded') ||
        element.classList.contains('script-loaded')) {
      return 'loaded';
    }

    if (element.classList.contains('lazy-error') || 
        element.classList.contains('component-error') ||
        element.classList.contains('script-error')) {
      return 'error';
    }

    return 'pending';
  }

  /**
   * 모든 대기 중인 요소 즉시 로딩
   */
  loadAll() {
    for (const [element, options] of this.elements) {
      this.loadElement(element, options);
    }
  }

  /**
   * 정리
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.elements.clear();
    this.moduleCache.clear();
  }

  /**
   * 통계 정보
   * @returns {Object}
   */
  getStats() {
    const states = {};
    
    for (const element of this.elements.keys()) {
      const state = this.getLoadingState(element);
      states[state] = (states[state] || 0) + 1;
    }

    return {
      total: this.elements.size,
      states,
      cacheSize: this.moduleCache.size
    };
  }
}

// 전역 지연 로더 인스턴스
let globalLazyLoader = null;

/**
 * 전역 지연 로더 가져오기
 * @param {LazyLoadOptions} [options] - 옵션
 * @returns {LazyLoader}
 */
export function getLazyLoader(options) {
  if (!globalLazyLoader) {
    globalLazyLoader = new LazyLoader(options);
  }
  return globalLazyLoader;
}

/**
 * 이미지 지연 로딩 헬퍼
 * @param {string} [selector='img[data-src]'] - 선택자
 * @param {LazyLoadOptions} [options] - 옵션
 */
export function lazyLoadImages(selector = 'img[data-src], img[data-lazy-src]', options = {}) {
  const loader = getLazyLoader();
  loader.observeAll(selector, options);
}

/**
 * 컴포넌트 지연 로딩 헬퍼
 * @param {string} [selector='[data-component]'] - 선택자
 * @param {LazyLoadOptions} [options] - 옵션
 */
export function lazyLoadComponents(selector = '[data-component]', options = {}) {
  const loader = getLazyLoader();
  loader.observeAll(selector, options);
}

/**
 * 조건부 지연 로딩 헬퍼
 * @param {string} selector - 선택자
 * @param {Function} condition - 조건 함수
 * @param {LazyLoadOptions} [options] - 옵션
 */
export function lazyLoadWhen(selector, condition, options = {}) {
  const loader = getLazyLoader();
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    loader.observeWhen(element, condition, options);
  });
}

/**
 * 뷰포트 기반 지연 로딩 (더 정밀한 제어)
 * @param {Element|string} element - 요소 또는 선택자
 * @param {Object} [viewportOptions] - 뷰포트 옵션
 * @param {number} [viewportOptions.topOffset=0] - 상단 오프셋
 * @param {number} [viewportOptions.bottomOffset=0] - 하단 오프셋
 * @param {LazyLoadOptions} [options] - 로딩 옵션
 */
export function lazyLoadInViewport(element, viewportOptions = {}, options = {}) {
  const { topOffset = 0, bottomOffset = 0 } = viewportOptions;
  
  const condition = () => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    return rect.top < (windowHeight + bottomOffset) && rect.bottom > -topOffset;
  };

  const loader = getLazyLoader();
  loader.observeWhen(element, condition, options);
}
