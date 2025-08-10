/**
 * @fileoverview 데이터 처리 유틸리티
 * 배열, 객체, 변환 등의 데이터 조작 기능
 */

/**
 * 배열 유틸리티
 */
export const array = {
  /**
   * 배열을 청크로 나누기
   * @param {Array} arr - 입력 배열
   * @param {number} size - 청크 크기
   * @returns {Array[]}
   */
  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * 배열에서 중복 제거
   * @param {Array} arr - 입력 배열
   * @param {Function} [keyFn] - 키 함수
   * @returns {Array}
   */
  unique(arr, keyFn) {
    if (!keyFn) return [...new Set(arr)];
    
    const seen = new Set();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  /**
   * 배열 그룹화
   * @param {Array} arr - 입력 배열
   * @param {Function} keyFn - 그룹 키 함수
   * @returns {Object}
   */
  groupBy(arr, keyFn) {
    return arr.reduce((groups, item) => {
      const key = keyFn(item);
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  /**
   * 배열 정렬 (다중 기준)
   * @param {Array} arr - 입력 배열
   * @param {Array} criteria - 정렬 기준 배열
   * @returns {Array}
   */
  sortBy(arr, criteria) {
    return [...arr].sort((a, b) => {
      for (const criterion of criteria) {
        const { key, order = 'asc' } = criterion;
        const aVal = typeof key === 'function' ? key(a) : a[key];
        const bVal = typeof key === 'function' ? key(b) : b[key];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
};

/**
 * 객체 유틸리티
 */
export const object = {
  /**
   * 깊은 복사
   * @param {any} obj - 복사할 객체
   * @returns {any}
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      Object.keys(obj).forEach(key => {
        clonedObj[key] = this.deepClone(obj[key]);
      });
      return clonedObj;
    }
  },

  /**
   * 객체 병합 (깊은 병합)
   * @param {Object} target - 대상 객체
   * @param {...Object} sources - 소스 객체들
   * @returns {Object}
   */
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      });
    }

    return this.deepMerge(target, ...sources);
  },

  /**
   * 객체 여부 확인
   * @param {any} item - 확인할 값
   * @returns {boolean}
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  /**
   * 중첩된 속성 가져오기
   * @param {Object} obj - 객체
   * @param {string} path - 경로 (예: 'a.b.c')
   * @param {any} defaultValue - 기본값
   * @returns {any}
   */
  get(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result?.[key] !== undefined) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }

    return result;
  },

  /**
   * 중첩된 속성 설정
   * @param {Object} obj - 객체
   * @param {string} path - 경로
   * @param {any} value - 값
   */
  set(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
};

/**
 * 문자열 유틸리티
 */
export const string = {
  /**
   * 카멜케이스로 변환
   * @param {string} str - 입력 문자열
   * @returns {string}
   */
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },

  /**
   * 케밥케이스로 변환
   * @param {string} str - 입력 문자열
   * @returns {string}
   */
  toKebabCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  },

  /**
   * 문자열 템플릿 처리
   * @param {string} template - 템플릿 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string}
   */
  template(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  },

  /**
   * 문자열 축약
   * @param {string} str - 입력 문자열
   * @param {number} length - 최대 길이
   * @param {string} suffix - 접미사
   * @returns {string}
   */
  truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  }
};

/**
 * 숫자 유틸리티
 */
export const number = {
  /**
   * 숫자 포맷팅
   * @param {number} num - 숫자
   * @param {Object} options - 옵션
   * @returns {string}
   */
  format(num, options = {}) {
    const { locale = 'ko-KR', style = 'decimal', currency = 'KRW' } = options;
    return new Intl.NumberFormat(locale, { style, currency }).format(num);
  },

  /**
   * 범위 내 값 제한
   * @param {number} num - 숫자
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {number}
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * 랜덤 숫자 생성
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @param {boolean} integer - 정수 여부
   * @returns {number}
   */
  random(min, max, integer = false) {
    const rand = Math.random() * (max - min) + min;
    return integer ? Math.floor(rand) : rand;
  }
};
