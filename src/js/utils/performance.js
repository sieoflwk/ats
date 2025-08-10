/**
 * 성능 최적화 유틸리티
 */

// 디바운스 함수
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

// 쓰로틀 함수
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 지연 로딩
export function lazyLoad(selector, callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  const config = { ...defaultOptions, ...options };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, config);

  const elements = document.querySelectorAll(selector);
  elements.forEach(el => observer.observe(el));

  return observer;
}

// 가상 스크롤링
export class VirtualScroller {
  constructor(container, itemHeight, totalItems, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.renderItem = renderItem;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.buffer = 5; // 버퍼 아이템 수
    
    this.init();
  }

  init() {
    this.container.style.position = 'relative';
    this.container.style.overflowY = 'auto';
    
    // 스크롤 컨테이너 생성
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.height = `${this.totalItems * this.itemHeight}px`;
    this.container.appendChild(this.scrollContainer);

    // 가시 영역 컨테이너 생성
    this.visibleContainer = document.createElement('div');
    this.visibleContainer.style.position = 'absolute';
    this.visibleContainer.style.top = '0';
    this.visibleContainer.style.width = '100%';
    this.scrollContainer.appendChild(this.visibleContainer);

    this.update();
    this.container.addEventListener('scroll', throttle(() => this.update(), 16));
  }

  update() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / this.itemHeight) + this.buffer,
      this.totalItems
    );

    if (start !== this.visibleStart || end !== this.visibleEnd) {
      this.visibleStart = Math.max(0, start - this.buffer);
      this.visibleEnd = end;
      this.render();
    }
  }

  render() {
    this.visibleContainer.innerHTML = '';
    this.visibleContainer.style.transform = `translateY(${this.visibleStart * this.itemHeight}px)`;

    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.renderItem(i);
      if (item) {
        item.style.height = `${this.itemHeight}px`;
        this.visibleContainer.appendChild(item);
      }
    }
  }

  updateTotalItems(newTotal) {
    this.totalItems = newTotal;
    this.scrollContainer.style.height = `${this.totalItems * this.itemHeight}px`;
    this.update();
  }
}

// 메모이제이션
export function memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    // 캐시 크기 제한 (LRU)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

// 배치 처리
export class BatchProcessor {
  constructor(processFn, batchSize = 10, delay = 0) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }

  add(item) {
    this.queue.push(item);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await this.processFn(batch);
      
      if (this.delay > 0 && this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}

// 이미지 지연 로딩
export function setupImageLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// 성능 모니터링
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startTiming(name) {
    this.metrics.set(name, performance.now());
  }

  endTiming(name) {
    const start = this.metrics.get(name);
    if (start) {
      const duration = performance.now() - start;
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log(`CLS: ${clsValue}`);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 리소스 힌트 추가
export function addResourceHints() {
  const head = document.head;
  
  // DNS 프리페치
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = '//fonts.googleapis.com';
  head.appendChild(dnsPrefetch);
  
  // 프리커넥트
  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://fonts.gstatic.com';
  preconnect.crossOrigin = '';
  head.appendChild(preconnect);
}

// Web Workers를 위한 헬퍼
export function createWorker(workerFunction) {
  const blob = new Blob([`(${workerFunction.toString()})()`], 
    { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// 메모리 정리
export function cleanupMemory() {
  // 이벤트 리스너 정리
  const oldEvents = [];
  
  return {
    addEventListener: (element, event, handler, options) => {
      element.addEventListener(event, handler, options);
      oldEvents.push({ element, event, handler });
    },
    
    cleanup: () => {
      oldEvents.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      oldEvents.length = 0;
    }
  };
}
