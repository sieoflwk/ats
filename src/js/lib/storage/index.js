/**
 * @fileoverview 저장소 관련 유틸리티
 * localStorage, sessionStorage, IndexedDB 등 통합 관리
 */

/**
 * 로컬 스토리지 래퍼
 */
export const local = {
  /**
   * 데이터 저장
   * @param {string} key - 키
   * @param {any} value - 값
   * @param {Object} options - 옵션
   */
  set(key, value, options = {}) {
    try {
      const { ttl, encrypt = false } = options;
      
      let data = {
        value,
        timestamp: Date.now()
      };

      if (ttl) {
        data.expiry = Date.now() + ttl;
      }

      if (encrypt) {
        data = this.encrypt(data);
      }

      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('localStorage.set failed:', error);
    }
  },

  /**
   * 데이터 조회
   * @param {string} key - 키
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      let data = JSON.parse(item);

      // 암호화된 데이터인 경우 복호화
      if (data.encrypted) {
        data = this.decrypt(data);
      }

      // TTL 확인
      if (data.expiry && Date.now() > data.expiry) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (error) {
      console.error('localStorage.get failed:', error);
      return defaultValue;
    }
  },

  /**
   * 데이터 삭제
   * @param {string} key - 키
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.remove failed:', error);
    }
  },

  /**
   * 모든 데이터 삭제
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('localStorage.clear failed:', error);
    }
  },

  /**
   * 키 목록 조회
   * @param {string} prefix - 접두사 필터
   * @returns {string[]}
   */
  keys(prefix = '') {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('localStorage.keys failed:', error);
      return [];
    }
  },

  /**
   * 스토리지 사용량 확인
   * @returns {Object}
   */
  usage() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // 대략적인 사용 가능 공간 (브라우저마다 다름)
      const total = 5 * 1024 * 1024; // 5MB 가정

      return {
        used,
        total,
        available: total - used,
        percentage: (used / total) * 100
      };
    } catch (error) {
      console.error('localStorage.usage failed:', error);
      return { used: 0, total: 0, available: 0, percentage: 0 };
    }
  },

  /**
   * 데이터 암호화 (간단한 Base64)
   * @param {any} data - 데이터
   * @returns {Object}
   * @private
   */
  encrypt(data) {
    return {
      encrypted: true,
      data: btoa(JSON.stringify(data))
    };
  },

  /**
   * 데이터 복호화
   * @param {Object} encryptedData - 암호화된 데이터
   * @returns {any}
   * @private
   */
  decrypt(encryptedData) {
    return JSON.parse(atob(encryptedData.data));
  }
};

/**
 * 세션 스토리지 래퍼
 */
export const session = {
  /**
   * 데이터 저장
   * @param {string} key - 키
   * @param {any} value - 값
   */
  set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('sessionStorage.set failed:', error);
    }
  },

  /**
   * 데이터 조회
   * @param {string} key - 키
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return defaultValue;

      const data = JSON.parse(item);
      return data.value;
    } catch (error) {
      console.error('sessionStorage.get failed:', error);
      return defaultValue;
    }
  },

  /**
   * 데이터 삭제
   * @param {string} key - 키
   */
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('sessionStorage.remove failed:', error);
    }
  },

  /**
   * 모든 데이터 삭제
   */
  clear() {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('sessionStorage.clear failed:', error);
    }
  }
};

/**
 * 메모리 스토리지 (브라우저 스토리지 사용 불가 시 대체)
 */
export const memory = {
  data: new Map(),

  /**
   * 데이터 저장
   * @param {string} key - 키
   * @param {any} value - 값
   * @param {Object} options - 옵션
   */
  set(key, value, options = {}) {
    const { ttl } = options;
    
    const data = {
      value,
      timestamp: Date.now()
    };

    if (ttl) {
      data.expiry = Date.now() + ttl;
    }

    this.data.set(key, data);
  },

  /**
   * 데이터 조회
   * @param {string} key - 키
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  get(key, defaultValue = null) {
    const data = this.data.get(key);
    if (!data) return defaultValue;

    // TTL 확인
    if (data.expiry && Date.now() > data.expiry) {
      this.remove(key);
      return defaultValue;
    }

    return data.value;
  },

  /**
   * 데이터 삭제
   * @param {string} key - 키
   */
  remove(key) {
    this.data.delete(key);
  },

  /**
   * 모든 데이터 삭제
   */
  clear() {
    this.data.clear();
  },

  /**
   * 키 목록 조회
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.data.keys());
  }
};

/**
 * 통합 스토리지 어댑터
 */
export class Storage {
  constructor(type = 'auto') {
    this.type = type;
    this.adapter = this.selectAdapter(type);
  }

  /**
   * 어댑터 선택
   * @param {string} type - 스토리지 타입
   * @returns {Object}
   * @private
   */
  selectAdapter(type) {
    switch (type) {
      case 'local':
        return this.isLocalStorageAvailable() ? local : memory;
      case 'session':
        return this.isSessionStorageAvailable() ? session : memory;
      case 'memory':
        return memory;
      case 'auto':
      default:
        if (this.isLocalStorageAvailable()) return local;
        if (this.isSessionStorageAvailable()) return session;
        return memory;
    }
  }

  /**
   * localStorage 사용 가능 여부 확인
   * @returns {boolean}
   * @private
   */
  isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * sessionStorage 사용 가능 여부 확인
   * @returns {boolean}
   * @private
   */
  isSessionStorageAvailable() {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 데이터 저장
   * @param {string} key - 키
   * @param {any} value - 값
   * @param {Object} options - 옵션
   */
  set(key, value, options) {
    return this.adapter.set(key, value, options);
  }

  /**
   * 데이터 조회
   * @param {string} key - 키
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  get(key, defaultValue) {
    return this.adapter.get(key, defaultValue);
  }

  /**
   * 데이터 삭제
   * @param {string} key - 키
   */
  remove(key) {
    return this.adapter.remove(key);
  }

  /**
   * 모든 데이터 삭제
   */
  clear() {
    return this.adapter.clear();
  }

  /**
   * 키 목록 조회
   * @param {string} prefix - 접두사 필터
   * @returns {string[]}
   */
  keys(prefix) {
    return this.adapter.keys ? this.adapter.keys(prefix) : [];
  }

  /**
   * 현재 어댑터 타입 조회
   * @returns {string}
   */
  getAdapterType() {
    if (this.adapter === local) return 'localStorage';
    if (this.adapter === session) return 'sessionStorage';
    if (this.adapter === memory) return 'memory';
    return 'unknown';
  }
}

/**
 * 캐시 저장소
 */
export class CacheStorage extends Storage {
  constructor(options = {}) {
    super(options.type || 'local');
    this.prefix = options.prefix || 'cache_';
    this.defaultTtl = options.defaultTtl || 5 * 60 * 1000; // 5분
  }

  /**
   * 캐시 저장
   * @param {string} key - 키
   * @param {any} value - 값
   * @param {number} ttl - TTL (ms)
   */
  setCache(key, value, ttl = this.defaultTtl) {
    const cacheKey = this.prefix + key;
    this.set(cacheKey, value, { ttl });
  }

  /**
   * 캐시 조회
   * @param {string} key - 키
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  getCache(key, defaultValue = null) {
    const cacheKey = this.prefix + key;
    return this.get(cacheKey, defaultValue);
  }

  /**
   * 캐시 삭제
   * @param {string} key - 키
   */
  removeCache(key) {
    const cacheKey = this.prefix + key;
    this.remove(cacheKey);
  }

  /**
   * 모든 캐시 삭제
   */
  clearCache() {
    const keys = this.keys(this.prefix);
    keys.forEach(key => this.remove(key));
  }

  /**
   * 캐시 통계
   * @returns {Object}
   */
  getCacheStats() {
    const keys = this.keys(this.prefix);
    let totalSize = 0;
    let expiredCount = 0;

    keys.forEach(key => {
      const item = this.adapter.get(key.replace(this.prefix, ''));
      if (item) {
        totalSize += JSON.stringify(item).length;
        if (item.expiry && Date.now() > item.expiry) {
          expiredCount++;
        }
      }
    });

    return {
      count: keys.length,
      totalSize,
      expiredCount
    };
  }
}

// 기본 인스턴스들
export const defaultStorage = new Storage('auto');
export const cacheStorage = new CacheStorage({ defaultTtl: 10 * 60 * 1000 }); // 10분
