/**
 * @fileoverview 네트워크 관련 유틸리티
 * HTTP 요청, WebSocket, 연결 상태 관리 등
 */

/**
 * HTTP 클라이언트
 */
export class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.timeout = options.timeout || 10000;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  /**
   * 요청 인터셉터 추가
   * @param {Function} interceptor - 인터셉터 함수
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * 응답 인터셉터 추가
   * @param {Function} interceptor - 인터셉터 함수
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * HTTP 요청 실행
   * @param {string} url - URL
   * @param {Object} options - 요청 옵션
   * @returns {Promise}
   */
  async request(url, options = {}) {
    let config = {
      url: this.baseURL + url,
      method: 'GET',
      headers: { ...this.defaultHeaders },
      ...options
    };

    // 요청 인터셉터 실행
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    try {
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
        ...config
      });

      clearTimeout(timeoutId);

      let result = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: null
      };

      // 응답 데이터 파싱
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result.data = await response.json();
      } else {
        result.data = await response.text();
      }

      // 응답 인터셉터 실행
      for (const interceptor of this.interceptors.response) {
        result = await interceptor(result);
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * GET 요청
   * @param {string} url - URL
   * @param {Object} config - 설정
   * @returns {Promise}
   */
  get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' });
  }

  /**
   * POST 요청
   * @param {string} url - URL
   * @param {any} data - 데이터
   * @param {Object} config - 설정
   * @returns {Promise}
   */
  post(url, data, config = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT 요청
   * @param {string} url - URL
   * @param {any} data - 데이터
   * @param {Object} config - 설정
   * @returns {Promise}
   */
  put(url, data, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE 요청
   * @param {string} url - URL
   * @param {Object} config - 설정
   * @returns {Promise}
   */
  delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' });
  }
}

/**
 * WebSocket 클라이언트
 */
export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  /**
   * 연결 시작
   * @returns {Promise}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (e) {
            this.emit('message', event.data);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.emit('disconnected', event);

          if (this.options.reconnect && !event.wasClean) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 재연결 시도
   * @private
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect().catch(() => {
        // 재연결 실패 시 다시 시도
      });
    }, this.options.reconnectInterval);
  }

  /**
   * 메시지 전송
   * @param {any} data - 데이터
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * 연결 종료
   * @param {number} code - 종료 코드
   * @param {string} reason - 종료 이유
   */
  disconnect(code = 1000, reason = 'Normal closure') {
    this.options.reconnect = false;
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트명
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트명
   * @param {Function} callback - 콜백 함수
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 발생
   * @param {string} event - 이벤트명
   * @param {...any} args - 인수들
   * @private
   */
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('WebSocket event handler error:', error);
        }
      });
    }
  }

  /**
   * 연결 상태 확인
   * @returns {string}
   */
  getReadyState() {
    if (!this.ws) return 'CLOSED';
    
    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return states[this.ws.readyState];
  }
}

/**
 * 연결 상태 모니터
 */
export class ConnectionMonitor {
  constructor(options = {}) {
    this.options = {
      checkInterval: 30000, // 30초
      timeout: 5000,
      ...options
    };
    
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.intervalId = null;

    this.init();
  }

  /**
   * 초기화
   * @private
   */
  init() {
    // 브라우저 이벤트 리스너
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 주기적 연결 확인
    this.startPeriodicCheck();
  }

  /**
   * 온라인 이벤트 처리
   * @private
   */
  handleOnline() {
    this.setOnlineStatus(true);
  }

  /**
   * 오프라인 이벤트 처리
   * @private
   */
  handleOffline() {
    this.setOnlineStatus(false);
  }

  /**
   * 온라인 상태 설정
   * @param {boolean} isOnline - 온라인 여부
   * @private
   */
  setOnlineStatus(isOnline) {
    if (this.isOnline !== isOnline) {
      this.isOnline = isOnline;
      this.notifyListeners(isOnline);
    }
  }

  /**
   * 주기적 연결 확인 시작
   * @private
   */
  startPeriodicCheck() {
    this.intervalId = setInterval(() => {
      this.checkConnection();
    }, this.options.checkInterval);
  }

  /**
   * 연결 확인
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch('/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const isOnline = response.ok;
      this.setOnlineStatus(isOnline);
      
      return isOnline;

    } catch (error) {
      this.setOnlineStatus(false);
      return false;
    }
  }

  /**
   * 연결 상태 변경 리스너 등록
   * @param {Function} callback - 콜백 함수
   */
  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * 리스너들에게 알림
   * @param {boolean} isOnline - 온라인 여부
   * @private
   */
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('Connection status listener error:', error);
      }
    });
  }

  /**
   * 모니터링 중지
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * 현재 연결 상태 조회
   * @returns {boolean}
   */
  getStatus() {
    return this.isOnline;
  }
}

/**
 * 요청 큐 (오프라인 시 요청 저장)
 */
export class RequestQueue {
  constructor(options = {}) {
    this.options = {
      maxSize: 100,
      storageKey: 'request_queue',
      ...options
    };
    
    this.queue = this.loadQueue();
    this.processing = false;
  }

  /**
   * 요청 추가
   * @param {Object} request - 요청 객체
   */
  add(request) {
    if (this.queue.length >= this.options.maxSize) {
      this.queue.shift(); // 가장 오래된 요청 제거
    }

    this.queue.push({
      ...request,
      timestamp: Date.now(),
      id: this.generateId()
    });

    this.saveQueue();
  }

  /**
   * 큐 처리
   * @param {HttpClient} httpClient - HTTP 클라이언트
   * @returns {Promise}
   */
  async process(httpClient) {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    const results = [];

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      
      try {
        const result = await httpClient.request(request.url, request.options);
        results.push({ success: true, request, result });
      } catch (error) {
        results.push({ success: false, request, error });
        // 실패한 요청은 다시 큐에 추가 (재시도 횟수 제한)
        if ((request.retryCount || 0) < 3) {
          request.retryCount = (request.retryCount || 0) + 1;
          this.queue.push(request);
        }
      }
    }

    this.saveQueue();
    this.processing = false;

    return results;
  }

  /**
   * 큐 저장
   * @private
   */
  saveQueue() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  /**
   * 큐 로드
   * @returns {Array}
   * @private
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load request queue:', error);
      return [];
    }
  }

  /**
   * ID 생성
   * @returns {string}
   * @private
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 큐 크기 조회
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * 큐 초기화
   */
  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

// 기본 인스턴스들
export const http = new HttpClient();
export const connectionMonitor = new ConnectionMonitor();
export const requestQueue = new RequestQueue();
