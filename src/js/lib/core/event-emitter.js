/**
 * @fileoverview 향상된 이벤트 에미터
 * 타입 안전성과 에러 처리를 강화한 이벤트 시스템
 */

/**
 * @typedef {Object} EventListener
 * @property {Function} handler - 이벤트 핸들러
 * @property {boolean} once - 일회성 리스너 여부
 * @property {number} priority - 우선순위 (높을수록 먼저 실행)
 * @property {string} [namespace] - 네임스페이스
 */

/**
 * 향상된 이벤트 에미터 클래스
 */
export default class EventEmitter {
  constructor() {
    /** @type {Map<string, EventListener[]>} */
    this.events = new Map();
    /** @type {Map<string, Function>} */
    this.middleware = new Map();
    this.maxListeners = 10;
    this.debug = false;
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러 함수
   * @param {Object} [options] - 옵션
   * @param {boolean} [options.once=false] - 일회성 여부
   * @param {number} [options.priority=0] - 우선순위
   * @param {string} [options.namespace] - 네임스페이스
   * @returns {Function} 리스너 제거 함수
   */
  on(event, handler, options = {}) {
    if (typeof event !== 'string') {
      throw new TypeError('Event name must be a string');
    }
    
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    const { once = false, priority = 0, namespace } = options;

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    
    // 최대 리스너 수 체크
    if (listeners.length >= this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${event} has ${listeners.length} listeners`);
    }

    const listener = { handler, once, priority, namespace };
    
    // 우선순위에 따라 정렬하여 삽입
    const insertIndex = listeners.findIndex(l => l.priority < priority);
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }

    if (this.debug) {
      console.log(`[EventEmitter] Listener added: ${event}`, { once, priority, namespace });
    }

    // 리스너 제거 함수 반환
    return () => this.off(event, handler, namespace);
  }

  /**
   * 일회성 이벤트 리스너 등록
   * @param {string} event - 이벤트명
   * @param {Function} handler - 핸들러 함수
   * @param {Object} [options] - 옵션
   * @returns {Function} 리스너 제거 함수
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true });
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트명
   * @param {Function} [handler] - 특정 핸들러 (없으면 모든 핸들러)
   * @param {string} [namespace] - 네임스페이스
   */
  off(event, handler, namespace) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);

    if (!handler && !namespace) {
      // 모든 리스너 제거
      this.events.delete(event);
      return;
    }

    const filteredListeners = listeners.filter(listener => {
      if (namespace && listener.namespace !== namespace) return true;
      if (handler && listener.handler !== handler) return true;
      return false;
    });

    if (filteredListeners.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, filteredListeners);
    }

    if (this.debug) {
      console.log(`[EventEmitter] Listener removed: ${event}`, { handler: !!handler, namespace });
    }
  }

  /**
   * 네임스페이스별 리스너 제거
   * @param {string} namespace - 네임스페이스
   */
  offNamespace(namespace) {
    for (const [event, listeners] of this.events) {
      const filteredListeners = listeners.filter(l => l.namespace !== namespace);
      
      if (filteredListeners.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, filteredListeners);
      }
    }

    if (this.debug) {
      console.log(`[EventEmitter] Namespace removed: ${namespace}`);
    }
  }

  /**
   * 이벤트 발생
   * @param {string} event - 이벤트명
   * @param {...any} args - 인수들
   * @returns {boolean} 리스너가 있었는지 여부
   */
  async emit(event, ...args) {
    if (!this.events.has(event)) return false;

    const listeners = [...this.events.get(event)]; // 복사본 생성
    
    if (listeners.length === 0) return false;

    // 미들웨어 실행
    if (this.middleware.has(event)) {
      try {
        const result = await this.middleware.get(event)(event, args);
        if (result === false) return false; // 이벤트 취소
      } catch (error) {
        console.error(`[EventEmitter] Middleware error for ${event}:`, error);
        return false;
      }
    }

    let hasListener = false;

    for (const listener of listeners) {
      try {
        hasListener = true;
        
        // 비동기 핸들러 지원
        if (listener.handler.constructor.name === 'AsyncFunction') {
          await listener.handler(...args);
        } else {
          listener.handler(...args);
        }

        // 일회성 리스너 제거
        if (listener.once) {
          this.off(event, listener.handler, listener.namespace);
        }

      } catch (error) {
        console.error(`[EventEmitter] Handler error for ${event}:`, error);
        
        // 에러 이벤트 발생
        if (event !== 'error') {
          this.emit('error', error, event, listener);
        }
      }
    }

    if (this.debug) {
      console.log(`[EventEmitter] Event emitted: ${event}`, args);
    }

    return hasListener;
  }

  /**
   * 미들웨어 등록
   * @param {string} event - 이벤트명
   * @param {Function} middleware - 미들웨어 함수
   */
  use(event, middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }

    this.middleware.set(event, middleware);
  }

  /**
   * 등록된 리스너 수 반환
   * @param {string} [event] - 특정 이벤트 (없으면 전체)
   * @returns {number}
   */
  listenerCount(event) {
    if (event) {
      return this.events.has(event) ? this.events.get(event).length : 0;
    }

    return Array.from(this.events.values()).reduce((total, listeners) => total + listeners.length, 0);
  }

  /**
   * 등록된 이벤트 목록 반환
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * 특정 이벤트의 리스너 목록 반환
   * @param {string} event - 이벤트명
   * @returns {Function[]}
   */
  listeners(event) {
    if (!this.events.has(event)) return [];
    return this.events.get(event).map(l => l.handler);
  }

  /**
   * 모든 리스너 제거
   */
  removeAllListeners() {
    this.events.clear();
    this.middleware.clear();
    
    if (this.debug) {
      console.log('[EventEmitter] All listeners removed');
    }
  }

  /**
   * 최대 리스너 수 설정
   * @param {number} max - 최대 수
   */
  setMaxListeners(max) {
    if (typeof max !== 'number' || max < 0) {
      throw new TypeError('Max listeners must be a non-negative number');
    }
    this.maxListeners = max;
  }

  /**
   * 디버그 모드 설정
   * @param {boolean} enabled - 활성화 여부
   */
  setDebug(enabled) {
    this.debug = Boolean(enabled);
  }

  /**
   * Promise 기반 이벤트 대기
   * @param {string} event - 이벤트명
   * @param {number} [timeout] - 타임아웃 (ms)
   * @returns {Promise<any[]>}
   */
  waitFor(event, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId;

      const cleanup = this.once(event, (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(args);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * 조건부 이벤트 리스너
   * @param {string} event - 이벤트명
   * @param {Function} condition - 조건 함수
   * @param {Function} handler - 핸들러 함수
   * @returns {Function} 리스너 제거 함수
   */
  when(event, condition, handler) {
    return this.on(event, (...args) => {
      if (condition(...args)) {
        handler(...args);
      }
    });
  }

  /**
   * 이벤트 파이프라이닝
   * @param {string} fromEvent - 소스 이벤트
   * @param {string} toEvent - 대상 이벤트
   * @param {Function} [transform] - 변환 함수
   * @returns {Function} 파이프 제거 함수
   */
  pipe(fromEvent, toEvent, transform) {
    return this.on(fromEvent, (...args) => {
      const transformedArgs = transform ? transform(...args) : args;
      this.emit(toEvent, ...transformedArgs);
    });
  }

  /**
   * 멀티캐스트 이벤트 발생
   * @param {string[]} events - 이벤트 목록
   * @param {...any} args - 인수들
   */
  async broadcast(events, ...args) {
    return Promise.all(events.map(event => this.emit(event, ...args)));
  }
}
