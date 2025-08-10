/**
 * @fileoverview 통합 로깅 시스템
 * 레벨별 로그, 필터링, 포매팅, 원격 전송 지원
 */

/**
 * @typedef {'trace'|'debug'|'info'|'warn'|'error'|'fatal'} LogLevel
 */

/**
 * @typedef {Object} LogEntry
 * @property {number} timestamp - 타임스탬프
 * @property {LogLevel} level - 로그 레벨
 * @property {string} message - 메시지
 * @property {any[]} args - 추가 인수들
 * @property {string} [category] - 카테고리
 * @property {Object} [context] - 컨텍스트 정보
 * @property {Error} [error] - 에러 객체
 */

/**
 * @typedef {Object} LoggerConfig
 * @property {LogLevel} level - 최소 로그 레벨
 * @property {boolean} console - 콘솔 출력 여부
 * @property {boolean} storage - 로컬 스토리지 저장 여부
 * @property {boolean} remote - 원격 전송 여부
 * @property {string} remoteUrl - 원격 전송 URL
 * @property {number} maxEntries - 최대 저장 개수
 * @property {string[]} categories - 활성 카테고리
 */

/**
 * 통합 로거 클래스
 */
export default class Logger {
  constructor(config = {}) {
    /** @type {LoggerConfig} */
    this.config = {
      level: 'info',
      console: true,
      storage: false,
      remote: false,
      remoteUrl: '',
      maxEntries: 1000,
      categories: [],
      ...config
    };

    /** @type {LogEntry[]} */
    this.entries = [];

    /** @type {Map<string, Function>} */
    this.formatters = new Map();

    /** @type {Map<string, Function>} */
    this.filters = new Map();

    // 로그 레벨 순서
    this.levels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5
    };

    this.setupDefaultFormatters();
    this.setupDefaultFilters();
    this.loadFromStorage();
  }

  /**
   * 기본 포매터 설정
   * @private
   */
  setupDefaultFormatters() {
    // 콘솔 포매터
    this.formatters.set('console', (entry) => {
      const timestamp = new Date(entry.timestamp).toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const category = entry.category ? `[${entry.category}]` : '';
      const prefix = `${timestamp} ${level} ${category}`;
      
      return {
        prefix,
        message: entry.message,
        args: entry.args,
        style: this.getConsoleStyle(entry.level)
      };
    });

    // JSON 포매터
    this.formatters.set('json', (entry) => {
      return JSON.stringify(entry);
    });

    // 개발자 친화적 포매터
    this.formatters.set('dev', (entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const emoji = this.getLevelEmoji(entry.level);
      const category = entry.category ? ` 📂${entry.category}` : '';
      
      return {
        prefix: `${emoji} ${time}${category}`,
        message: entry.message,
        args: entry.args
      };
    });
  }

  /**
   * 기본 필터 설정
   * @private
   */
  setupDefaultFilters() {
    // 레벨 필터
    this.filters.set('level', (entry) => {
      return this.levels[entry.level] >= this.levels[this.config.level];
    });

    // 카테고리 필터
    this.filters.set('category', (entry) => {
      if (this.config.categories.length === 0) return true;
      return this.config.categories.includes(entry.category);
    });
  }

  /**
   * 로그 메서드들
   */
  trace(message, ...args) { return this.log('trace', message, ...args); }
  debug(message, ...args) { return this.log('debug', message, ...args); }
  info(message, ...args) { return this.log('info', message, ...args); }
  warn(message, ...args) { return this.log('warn', message, ...args); }
  error(message, ...args) { return this.log('error', message, ...args); }
  fatal(message, ...args) { return this.log('fatal', message, ...args); }

  /**
   * 기본 로그 메서드
   * @param {LogLevel} level - 로그 레벨
   * @param {string} message - 메시지
   * @param {...any} args - 추가 인수들
   */
  log(level, message, ...args) {
    const entry = this.createEntry(level, message, args);
    
    if (!this.shouldLog(entry)) return;

    this.addEntry(entry);

    if (this.config.console) {
      this.outputToConsole(entry);
    }

    if (this.config.storage) {
      this.saveToStorage();
    }

    if (this.config.remote) {
      this.sendToRemote(entry);
    }

    return entry;
  }

  /**
   * 카테고리별 로그
   * @param {string} category - 카테고리
   * @param {LogLevel} level - 로그 레벨
   * @param {string} message - 메시지
   * @param {...any} args - 추가 인수들
   */
  logCategory(category, level, message, ...args) {
    const entry = this.createEntry(level, message, args, { category });
    
    if (!this.shouldLog(entry)) return;

    this.addEntry(entry);

    if (this.config.console) {
      this.outputToConsole(entry);
    }

    if (this.config.storage) {
      this.saveToStorage();
    }

    if (this.config.remote) {
      this.sendToRemote(entry);
    }

    return entry;
  }

  /**
   * 에러 로그 (스택 트레이스 포함)
   * @param {Error} error - 에러 객체
   * @param {string} [message] - 추가 메시지
   * @param {Object} [context] - 컨텍스트 정보
   */
  logError(error, message, context = {}) {
    const entry = this.createEntry('error', message || error.message, [error], {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });

    this.addEntry(entry);

    if (this.config.console) {
      console.error(entry.message, error, context);
    }

    if (this.config.storage) {
      this.saveToStorage();
    }

    if (this.config.remote) {
      this.sendToRemote(entry);
    }

    return entry;
  }

  /**
   * 성능 측정 로그
   * @param {string} label - 라벨
   * @param {Function} fn - 측정할 함수
   * @returns {Promise<any>}
   */
  async logPerformance(label, fn) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.info(`⚡ ${label} completed in ${duration.toFixed(2)}ms`, { duration, label });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.error(`❌ ${label} failed after ${duration.toFixed(2)}ms`, error, { duration, label });
      
      throw error;
    }
  }

  /**
   * 그룹 로그 시작
   * @param {string} label - 그룹 라벨
   * @param {boolean} [collapsed=false] - 접힌 상태로 시작
   */
  group(label, collapsed = false) {
    if (this.config.console) {
      if (collapsed) {
        console.groupCollapsed(`📁 ${label}`);
      } else {
        console.group(`📁 ${label}`);
      }
    }
    
    this.info(`Group started: ${label}`);
  }

  /**
   * 그룹 로그 종료
   */
  groupEnd() {
    if (this.config.console) {
      console.groupEnd();
    }
    
    this.info('Group ended');
  }

  /**
   * 테이블 로그
   * @param {Object[]|Object} data - 테이블 데이터
   * @param {string[]} [columns] - 표시할 컬럼
   */
  table(data, columns) {
    if (this.config.console) {
      if (columns) {
        console.table(data, columns);
      } else {
        console.table(data);
      }
    }
    
    this.debug('Table data logged', { data, columns });
  }

  /**
   * 로그 엔트리 생성
   * @param {LogLevel} level - 로그 레벨
   * @param {string} message - 메시지
   * @param {any[]} args - 인수들
   * @param {Object} [extra] - 추가 정보
   * @returns {LogEntry}
   * @private
   */
  createEntry(level, message, args, extra = {}) {
    return {
      timestamp: Date.now(),
      level,
      message,
      args: [...args],
      ...extra
    };
  }

  /**
   * 로그 출력 여부 결정
   * @param {LogEntry} entry - 로그 엔트리
   * @returns {boolean}
   * @private
   */
  shouldLog(entry) {
    for (const filter of this.filters.values()) {
      if (!filter(entry)) return false;
    }
    return true;
  }

  /**
   * 엔트리 추가
   * @param {LogEntry} entry - 로그 엔트리
   * @private
   */
  addEntry(entry) {
    this.entries.push(entry);
    
    // 최대 개수 제한
    if (this.entries.length > this.config.maxEntries) {
      this.entries.shift();
    }
  }

  /**
   * 콘솔 출력
   * @param {LogEntry} entry - 로그 엔트리
   * @private
   */
  outputToConsole(entry) {
    const formatter = this.formatters.get('dev');
    const formatted = formatter(entry);
    
    const consoleMethod = this.getConsoleMethod(entry.level);
    
    if (formatted.style) {
      consoleMethod(`%c${formatted.prefix} ${formatted.message}`, formatted.style, ...formatted.args);
    } else {
      consoleMethod(`${formatted.prefix} ${formatted.message}`, ...formatted.args);
    }
  }

  /**
   * 로컬 스토리지 저장
   * @private
   */
  saveToStorage() {
    try {
      const data = JSON.stringify(this.entries.slice(-100)); // 최근 100개만 저장
      localStorage.setItem('logger_entries', data);
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * 로컬 스토리지에서 로드
   * @private
   */
  loadFromStorage() {
    if (!this.config.storage) return;
    
    try {
      const data = localStorage.getItem('logger_entries');
      if (data) {
        this.entries = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
    }
  }

  /**
   * 원격 서버로 전송
   * @param {LogEntry} entry - 로그 엔트리
   * @private
   */
  async sendToRemote(entry) {
    if (!this.config.remoteUrl) return;
    
    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Failed to send log to remote:', error);
    }
  }

  /**
   * 레벨별 콘솔 메서드 반환
   * @param {LogLevel} level - 로그 레벨
   * @returns {Function}
   * @private
   */
  getConsoleMethod(level) {
    switch (level) {
      case 'trace': return console.trace.bind(console);
      case 'debug': return console.debug.bind(console);
      case 'info': return console.info.bind(console);
      case 'warn': return console.warn.bind(console);
      case 'error': return console.error.bind(console);
      case 'fatal': return console.error.bind(console);
      default: return console.log.bind(console);
    }
  }

  /**
   * 레벨별 이모지 반환
   * @param {LogLevel} level - 로그 레벨
   * @returns {string}
   * @private
   */
  getLevelEmoji(level) {
    const emojis = {
      trace: '🔍',
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀'
    };
    return emojis[level] || 'ℹ️';
  }

  /**
   * 레벨별 콘솔 스타일 반환
   * @param {LogLevel} level - 로그 레벨
   * @returns {string}
   * @private
   */
  getConsoleStyle(level) {
    const styles = {
      trace: 'color: #888; font-size: 11px;',
      debug: 'color: #00f; font-weight: normal;',
      info: 'color: #000; font-weight: normal;',
      warn: 'color: #f80; font-weight: bold;',
      error: 'color: #f00; font-weight: bold;',
      fatal: 'color: #f00; font-weight: bold; background: #fdd;'
    };
    return styles[level] || '';
  }

  /**
   * 로그 레벨 설정
   * @param {LogLevel} level - 새 로그 레벨
   */
  setLevel(level) {
    this.config.level = level;
  }

  /**
   * 카테고리 필터 설정
   * @param {string[]} categories - 활성 카테고리 목록
   */
  setCategories(categories) {
    this.config.categories = [...categories];
  }

  /**
   * 커스텀 포매터 추가
   * @param {string} name - 포매터 이름
   * @param {Function} formatter - 포매터 함수
   */
  addFormatter(name, formatter) {
    this.formatters.set(name, formatter);
  }

  /**
   * 커스텀 필터 추가
   * @param {string} name - 필터 이름
   * @param {Function} filter - 필터 함수
   */
  addFilter(name, filter) {
    this.filters.set(name, filter);
  }

  /**
   * 로그 엔트리 검색
   * @param {Object} criteria - 검색 조건
   * @returns {LogEntry[]}
   */
  search(criteria = {}) {
    return this.entries.filter(entry => {
      if (criteria.level && entry.level !== criteria.level) return false;
      if (criteria.category && entry.category !== criteria.category) return false;
      if (criteria.message && !entry.message.includes(criteria.message)) return false;
      if (criteria.since && entry.timestamp < criteria.since) return false;
      if (criteria.until && entry.timestamp > criteria.until) return false;
      return true;
    });
  }

  /**
   * 로그 내보내기
   * @param {string} [format='json'] - 내보내기 형식
   * @returns {string}
   */
  export(format = 'json') {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }

    return this.entries.map(entry => formatter(entry)).join('\n');
  }

  /**
   * 로그 지우기
   * @param {Object} [criteria] - 삭제 조건 (없으면 전체)
   */
  clear(criteria) {
    if (!criteria) {
      this.entries = [];
    } else {
      this.entries = this.entries.filter(entry => {
        if (criteria.level && entry.level === criteria.level) return false;
        if (criteria.category && entry.category === criteria.category) return false;
        if (criteria.before && entry.timestamp > criteria.before) return false;
        return true;
      });
    }

    if (this.config.storage) {
      this.saveToStorage();
    }
  }

  /**
   * 로그 통계
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this.entries.length,
      byLevel: {},
      byCategory: {},
      timeRange: null
    };

    if (this.entries.length > 0) {
      const timestamps = this.entries.map(e => e.timestamp);
      stats.timeRange = {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps)
      };
    }

    for (const entry of this.entries) {
      // 레벨별 통계
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      
      // 카테고리별 통계
      if (entry.category) {
        stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      }
    }

    return stats;
  }
}

// 전역 로거 인스턴스
let globalLogger = null;

/**
 * 전역 로거 가져오기
 * @param {LoggerConfig} [config] - 설정
 * @returns {Logger}
 */
export function getLogger(config) {
  if (!globalLogger) {
    globalLogger = new Logger(config);
  }
  return globalLogger;
}

/**
 * 카테고리별 로거 생성
 * @param {string} category - 카테고리
 * @returns {Object}
 */
export function createCategoryLogger(category) {
  const logger = getLogger();
  
  return {
    trace: (msg, ...args) => logger.logCategory(category, 'trace', msg, ...args),
    debug: (msg, ...args) => logger.logCategory(category, 'debug', msg, ...args),
    info: (msg, ...args) => logger.logCategory(category, 'info', msg, ...args),
    warn: (msg, ...args) => logger.logCategory(category, 'warn', msg, ...args),
    error: (msg, ...args) => logger.logCategory(category, 'error', msg, ...args),
    fatal: (msg, ...args) => logger.logCategory(category, 'fatal', msg, ...args)
  };
}
