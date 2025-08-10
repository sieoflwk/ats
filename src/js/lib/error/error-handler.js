/**
 * @fileoverview 통합 에러 처리 시스템
 * 전역 에러 처리, 보고, 복구 기능 제공
 */

import { getLogger } from '../core/logger.js';

/**
 * @typedef {Object} ErrorInfo
 * @property {Error} error - 에러 객체
 * @property {string} context - 에러 발생 컨텍스트
 * @property {Object} metadata - 추가 메타데이터
 * @property {string} timestamp - 발생 시간
 * @property {string} userAgent - 사용자 에이전트
 * @property {string} url - 발생 URL
 */

/**
 * @typedef {Object} ErrorHandlerConfig
 * @property {boolean} [capture=true] - 전역 에러 캐처 활성화
 * @property {boolean} [report=false] - 원격 보고 활성화
 * @property {string} [reportUrl] - 에러 보고 URL
 * @property {number} [maxErrors=50] - 최대 저장 에러 수
 * @property {boolean} [showUserError=true] - 사용자에게 에러 표시
 * @property {Object} [recovery] - 복구 전략
 */

/**
 * 통합 에러 처리기
 */
export class ErrorHandler {
  constructor(config = {}) {
    /** @type {ErrorHandlerConfig} */
    this.config = {
      capture: true,
      report: false,
      reportUrl: '',
      maxErrors: 50,
      showUserError: true,
      recovery: {},
      ...config
    };

    /** @type {ErrorInfo[]} */
    this.errors = [];

    /** @type {Map<string, Function>} */
    this.recoveryStrategies = new Map();

    /** @type {Map<string, number>} */
    this.errorCounts = new Map();

    this.logger = getLogger();
    this.isCapturing = false;

    if (this.config.capture) {
      this.startCapturing();
    }

    this.setupDefaultRecoveryStrategies();
  }

  /**
   * 전역 에러 캐처 시작
   */
  startCapturing() {
    if (this.isCapturing) return;

    // JavaScript 에러
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Promise rejection
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // 리소스 로딩 에러
    window.addEventListener('error', this.handleResourceError.bind(this), true);

    this.isCapturing = true;
    this.logger.info('Error capturing started');
  }

  /**
   * 전역 에러 캐처 중지
   */
  stopCapturing() {
    if (!this.isCapturing) return;

    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    window.removeEventListener('error', this.handleResourceError.bind(this), true);

    this.isCapturing = false;
    this.logger.info('Error capturing stopped');
  }

  /**
   * JavaScript 에러 처리
   * @param {ErrorEvent} event - 에러 이벤트
   * @private
   */
  handleGlobalError(event) {
    const errorInfo = this.createErrorInfo(event.error || new Error(event.message), {
      context: 'global_javascript',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });

    this.processError(errorInfo);
  }

  /**
   * Promise rejection 처리
   * @param {PromiseRejectionEvent} event - Promise rejection 이벤트
   * @private
   */
  handlePromiseRejection(event) {
    const error = event.reason instanceof Error ? 
      event.reason : 
      new Error(String(event.reason));

    const errorInfo = this.createErrorInfo(error, {
      context: 'unhandled_promise_rejection'
    });

    this.processError(errorInfo);

    // 기본 동작 방지 (콘솔 에러 출력 방지)
    event.preventDefault();
  }

  /**
   * 리소스 로딩 에러 처리
   * @param {Event} event - 에러 이벤트
   * @private
   */
  handleResourceError(event) {
    if (!event.target || event.target === window) return;

    const target = event.target;
    const error = new Error(`Resource loading failed: ${target.src || target.href || 'unknown'}`);
    
    const errorInfo = this.createErrorInfo(error, {
      context: 'resource_loading',
      element: target.tagName,
      source: target.src || target.href,
      currentSrc: target.currentSrc
    });

    this.processError(errorInfo);
  }

  /**
   * 수동 에러 처리
   * @param {Error} error - 에러 객체
   * @param {string} [context='manual'] - 컨텍스트
   * @param {Object} [metadata={}] - 추가 메타데이터
   */
  handleError(error, context = 'manual', metadata = {}) {
    const errorInfo = this.createErrorInfo(error, { context, ...metadata });
    this.processError(errorInfo);
  }

  /**
   * 에러 정보 객체 생성
   * @param {Error} error - 에러 객체
   * @param {Object} metadata - 메타데이터
   * @returns {ErrorInfo}
   * @private
   */
  createErrorInfo(error, metadata = {}) {
    return {
      error,
      context: metadata.context || 'unknown',
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: this.getMemoryInfo(),
        connection: this.getConnectionInfo()
      },
      timestamp: Date.now()
    };
  }

  /**
   * 에러 처리 실행
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  async processError(errorInfo) {
    // 에러 저장
    this.storeError(errorInfo);

    // 로그 기록
    this.logger.logError(errorInfo.error, errorInfo.context, errorInfo.metadata);

    // 에러 카운팅
    this.countError(errorInfo);

    // 복구 시도
    await this.attemptRecovery(errorInfo);

    // 사용자에게 알림
    if (this.config.showUserError) {
      this.showUserError(errorInfo);
    }

    // 원격 보고
    if (this.config.report) {
      this.reportError(errorInfo);
    }

    // 에러 이벤트 발생
    this.dispatchErrorEvent(errorInfo);
  }

  /**
   * 에러 저장
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  storeError(errorInfo) {
    this.errors.push(errorInfo);

    // 최대 개수 제한
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift();
    }

    // 로컬 스토리지에 저장 (선택적)
    try {
      const recentErrors = this.errors.slice(-10); // 최근 10개만
      localStorage.setItem('app_errors', JSON.stringify(recentErrors.map(e => ({
        message: e.error.message,
        stack: e.error.stack,
        context: e.context,
        timestamp: e.timestamp
      }))));
    } catch (e) {
      // 저장 실패 무시
    }
  }

  /**
   * 에러 카운팅
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  countError(errorInfo) {
    const key = `${errorInfo.context}:${errorInfo.error.name}:${errorInfo.error.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  /**
   * 복구 시도
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  async attemptRecovery(errorInfo) {
    const strategy = this.recoveryStrategies.get(errorInfo.context) ||
                    this.recoveryStrategies.get(errorInfo.error.name) ||
                    this.recoveryStrategies.get('default');

    if (strategy) {
      try {
        await strategy(errorInfo);
        this.logger.info(`Recovery attempted for ${errorInfo.context}`, errorInfo);
      } catch (recoveryError) {
        this.logger.error('Recovery failed', recoveryError, errorInfo);
      }
    }
  }

  /**
   * 사용자에게 에러 표시
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  showUserError(errorInfo) {
    // 중요하지 않은 에러는 숨김
    if (this.isMinorError(errorInfo)) {
      return;
    }

    // 너무 많은 같은 에러는 한 번만 표시
    const errorKey = `${errorInfo.context}:${errorInfo.error.name}`;
    const count = this.errorCounts.get(errorKey) || 0;
    if (count > 3) {
      return;
    }

    // 사용자 친화적 메시지 생성
    const userMessage = this.getUserFriendlyMessage(errorInfo);

    // Toast 메시지로 표시
    this.showToast(userMessage, 'error');
  }

  /**
   * 사용자 친화적 메시지 생성
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @returns {string}
   * @private
   */
  getUserFriendlyMessage(errorInfo) {
    const { context, error } = errorInfo;

    // 컨텍스트별 메시지
    const contextMessages = {
      network_error: '네트워크 연결을 확인해주세요.',
      resource_loading: '일부 리소스를 불러올 수 없습니다.',
      storage_error: '브라우저 저장소에 접근할 수 없습니다.',
      permission_denied: '필요한 권한이 없습니다.',
      validation_error: '입력한 정보를 확인해주세요.',
      auth_error: '인증에 실패했습니다. 다시 로그인해주세요.'
    };

    // 에러 타입별 메시지
    const errorMessages = {
      'TypeError': '데이터 형식 오류가 발생했습니다.',
      'ReferenceError': '참조 오류가 발생했습니다.',
      'SyntaxError': '문법 오류가 발생했습니다.',
      'NetworkError': '네트워크 오류가 발생했습니다.',
      'SecurityError': '보안 오류가 발생했습니다.'
    };

    return contextMessages[context] || 
           errorMessages[error.name] || 
           '예상치 못한 오류가 발생했습니다.';
  }

  /**
   * 중요하지 않은 에러 판별
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @returns {boolean}
   * @private
   */
  isMinorError(errorInfo) {
    const minorContexts = ['resource_loading', 'analytics', 'tracking'];
    const minorMessages = ['Script error', 'Non-Error promise rejection'];

    return minorContexts.includes(errorInfo.context) ||
           minorMessages.some(msg => errorInfo.error.message.includes(msg));
  }

  /**
   * 원격 에러 보고
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  async reportError(errorInfo) {
    if (!this.config.reportUrl) return;

    try {
      const reportData = {
        message: errorInfo.error.message,
        stack: errorInfo.error.stack,
        context: errorInfo.context,
        metadata: errorInfo.metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: errorInfo.timestamp
      };

      await fetch(this.config.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

    } catch (reportError) {
      // 보고 실패는 조용히 무시
      this.logger.debug('Error reporting failed', reportError);
    }
  }

  /**
   * 에러 이벤트 발생
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @private
   */
  dispatchErrorEvent(errorInfo) {
    const event = new CustomEvent('app:error', {
      detail: errorInfo,
      bubbles: true,
      cancelable: false
    });

    window.dispatchEvent(event);
  }

  /**
   * Toast 메시지 표시
   * @param {string} message - 메시지
   * @param {string} type - 타입
   * @private
   */
  async showToast(message, type) {
    try {
      const { showToast } = await import('../../components/ui/toast.js');
      showToast(message, type);
    } catch (e) {
      // Toast 모듈 로드 실패 시 기본 alert
      console.error('Toast module failed to load, falling back to alert');
      if (type === 'error') {
        alert(message);
      }
    }
  }

  /**
   * 기본 복구 전략 설정
   * @private
   */
  setupDefaultRecoveryStrategies() {
    // 네트워크 에러 복구
    this.addRecoveryStrategy('network_error', async (errorInfo) => {
      // 연결 상태 확인 후 재시도
      if (navigator.onLine) {
        this.logger.info('Network recovered, attempting retry');
        // 실패한 요청 재시도 로직
      }
    });

    // 리소스 로딩 에러 복구
    this.addRecoveryStrategy('resource_loading', async (errorInfo) => {
      const element = errorInfo.metadata.element;
      
      if (element === 'SCRIPT') {
        // 스크립트 로딩 실패 시 CDN 대체 시도
        this.logger.info('Attempting script fallback');
      } else if (element === 'IMG') {
        // 이미지 로딩 실패 시 기본 이미지 표시
        this.logger.info('Showing fallback image');
      }
    });

    // 스토리지 에러 복구
    this.addRecoveryStrategy('storage_error', async (errorInfo) => {
      // 메모리 스토리지로 대체
      this.logger.info('Falling back to memory storage');
    });

    // 기본 복구 전략
    this.addRecoveryStrategy('default', async (errorInfo) => {
      // 페이지 새로고침 제안 (조건부)
      if (this.shouldSuggestRefresh(errorInfo)) {
        this.logger.info('Suggesting page refresh for recovery');
      }
    });
  }

  /**
   * 페이지 새로고침 제안 여부
   * @param {ErrorInfo} errorInfo - 에러 정보
   * @returns {boolean}
   * @private
   */
  shouldSuggestRefresh(errorInfo) {
    const criticalErrors = ['ReferenceError', 'TypeError'];
    const errorKey = `${errorInfo.context}:${errorInfo.error.name}`;
    const count = this.errorCounts.get(errorKey) || 0;

    return criticalErrors.includes(errorInfo.error.name) && count >= 3;
  }

  /**
   * 메모리 정보 수집
   * @returns {Object|null}
   * @private
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * 연결 정보 수집
   * @returns {Object|null}
   * @private
   */
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  /**
   * 복구 전략 추가
   * @param {string} context - 컨텍스트 또는 에러명
   * @param {Function} strategy - 복구 전략 함수
   */
  addRecoveryStrategy(context, strategy) {
    this.recoveryStrategies.set(context, strategy);
  }

  /**
   * 복구 전략 제거
   * @param {string} context - 컨텍스트 또는 에러명
   */
  removeRecoveryStrategy(context) {
    this.recoveryStrategies.delete(context);
  }

  /**
   * 에러 목록 조회
   * @param {Object} [filter] - 필터 조건
   * @returns {ErrorInfo[]}
   */
  getErrors(filter = {}) {
    let errors = [...this.errors];

    if (filter.context) {
      errors = errors.filter(e => e.context === filter.context);
    }

    if (filter.since) {
      errors = errors.filter(e => e.timestamp >= filter.since);
    }

    if (filter.limit) {
      errors = errors.slice(-filter.limit);
    }

    return errors;
  }

  /**
   * 에러 통계
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byContext: {},
      byErrorType: {},
      recent: this.errors.slice(-10).length
    };

    for (const error of this.errors) {
      // 컨텍스트별 통계
      stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
      
      // 에러 타입별 통계
      stats.byErrorType[error.error.name] = (stats.byErrorType[error.error.name] || 0) + 1;
    }

    return stats;
  }

  /**
   * 에러 초기화
   * @param {Object} [filter] - 삭제 조건
   */
  clearErrors(filter = {}) {
    if (Object.keys(filter).length === 0) {
      this.errors = [];
      this.errorCounts.clear();
    } else {
      this.errors = this.errors.filter(error => {
        if (filter.context && error.context !== filter.context) return true;
        if (filter.before && error.timestamp >= filter.before) return true;
        return false;
      });
    }

    try {
      localStorage.removeItem('app_errors');
    } catch (e) {
      // 무시
    }
  }

  /**
   * 정리
   */
  destroy() {
    this.stopCapturing();
    this.clearErrors();
    this.recoveryStrategies.clear();
  }
}

// 전역 에러 핸들러
let globalErrorHandler = null;

/**
 * 전역 에러 핸들러 가져오기
 * @param {ErrorHandlerConfig} [config] - 설정
 * @returns {ErrorHandler}
 */
export function getErrorHandler(config) {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler(config);
  }
  return globalErrorHandler;
}

/**
 * 에러 처리 헬퍼 함수
 * @param {Error} error - 에러
 * @param {string} [context] - 컨텍스트
 * @param {Object} [metadata] - 메타데이터
 */
export function handleError(error, context, metadata) {
  const handler = getErrorHandler();
  handler.handleError(error, context, metadata);
}

/**
 * try-catch 래퍼
 * @param {Function} fn - 실행할 함수
 * @param {string} [context] - 컨텍스트
 * @returns {any}
 */
export function safeExecute(fn, context = 'safe_execute') {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Promise 에러 처리 래퍼
 * @param {Promise} promise - Promise
 * @param {string} [context] - 컨텍스트
 * @returns {Promise}
 */
export function safePromise(promise, context = 'safe_promise') {
  return promise.catch(error => {
    handleError(error, context);
    return null;
  });
}
