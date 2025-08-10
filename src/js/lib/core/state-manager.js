/**
 * @fileoverview 전역 상태 관리자
 * Redux 스타일의 상태 관리를 간소화한 버전
 */

import EventEmitter from './event-emitter.js';

/**
 * @typedef {Object} StateSlice
 * @property {any} state - 현재 상태
 * @property {Object.<string, Function>} reducers - 리듀서 맵
 * @property {Object.<string, Function>} actions - 액션 맵
 */

/**
 * @typedef {Object} StateAction
 * @property {string} type - 액션 타입
 * @property {any} [payload] - 페이로드
 * @property {Object} [meta] - 메타데이터
 */

/**
 * 전역 상태 관리자
 */
export default class StateManager extends EventEmitter {
  constructor() {
    super();
    
    /** @type {Object} */
    this.state = {};
    
    /** @type {Map<string, StateSlice>} */
    this.slices = new Map();
    
    /** @type {Function[]} */
    this.middleware = [];
    
    /** @type {StateAction[]} */
    this.history = [];
    
    this.maxHistorySize = 50;
    this.devTools = false;
  }

  /**
   * 상태 슬라이스 등록
   * @param {string} name - 슬라이스 이름
   * @param {StateSlice} slice - 슬라이스 정의
   */
  addSlice(name, slice) {
    if (this.slices.has(name)) {
      throw new Error(`Slice '${name}' already exists`);
    }

    this.slices.set(name, slice);
    this.state[name] = slice.state;

    // 액션 메서드 바인딩
    if (slice.actions) {
      Object.keys(slice.actions).forEach(actionName => {
        const actionCreator = slice.actions[actionName];
        this[`${name}${this.capitalize(actionName)}`] = (...args) => {
          const action = actionCreator(...args);
          return this.dispatch({ ...action, type: `${name}/${action.type}` });
        };
      });
    }

    this.emit('slice:added', name, slice);
  }

  /**
   * 액션 디스패치
   * @param {StateAction} action - 액션
   * @returns {StateAction} 디스패치된 액션
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action must have a type');
    }

    // 미들웨어 실행
    let finalAction = action;
    for (const middleware of this.middleware) {
      finalAction = middleware(finalAction, this.getState.bind(this)) || finalAction;
    }

    const [sliceName, actionType] = finalAction.type.split('/');
    const slice = this.slices.get(sliceName);

    if (!slice) {
      console.warn(`Unknown slice: ${sliceName}`);
      return finalAction;
    }

    const reducer = slice.reducers[actionType];
    if (!reducer) {
      console.warn(`Unknown action: ${finalAction.type}`);
      return finalAction;
    }

    const prevState = this.state[sliceName];
    const newState = reducer(prevState, finalAction);

    // 상태 변경 검사
    if (newState !== prevState) {
      this.state[sliceName] = newState;
      
      // 히스토리 관리
      this.addToHistory(finalAction);
      
      // 이벤트 발생
      this.emit('state:changed', sliceName, newState, prevState);
      this.emit(`state:${sliceName}`, newState, prevState);
      
      // DevTools 연동
      if (this.devTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
        window.__REDUX_DEVTOOLS_EXTENSION__.send(finalAction, this.state);
      }
    }

    return finalAction;
  }

  /**
   * 현재 상태 반환
   * @param {string} [sliceName] - 특정 슬라이스
   * @returns {any}
   */
  getState(sliceName) {
    if (sliceName) {
      return this.state[sliceName];
    }
    return { ...this.state };
  }

  /**
   * 상태 구독
   * @param {string} sliceName - 슬라이스 이름
   * @param {Function} listener - 리스너 함수
   * @returns {Function} 구독 해제 함수
   */
  subscribe(sliceName, listener) {
    return this.on(`state:${sliceName}`, listener);
  }

  /**
   * 선택자 기반 구독
   * @param {Function} selector - 선택자 함수
   * @param {Function} listener - 리스너 함수
   * @returns {Function} 구독 해제 함수
   */
  select(selector, listener) {
    let currentValue = selector(this.state);
    
    return this.on('state:changed', () => {
      const newValue = selector(this.state);
      if (newValue !== currentValue) {
        const prevValue = currentValue;
        currentValue = newValue;
        listener(newValue, prevValue);
      }
    });
  }

  /**
   * 미들웨어 추가
   * @param {Function} middleware - 미들웨어 함수
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middleware.push(middleware);
  }

  /**
   * 상태 초기화
   * @param {string} [sliceName] - 특정 슬라이스 (없으면 전체)
   */
  reset(sliceName) {
    if (sliceName) {
      const slice = this.slices.get(sliceName);
      if (slice) {
        this.state[sliceName] = slice.state;
        this.emit(`state:${sliceName}`, slice.state, this.state[sliceName]);
      }
    } else {
      for (const [name, slice] of this.slices) {
        this.state[name] = slice.state;
      }
      this.emit('state:reset');
    }
    
    this.history = [];
  }

  /**
   * 액션 히스토리에 추가
   * @param {StateAction} action - 액션
   * @private
   */
  addToHistory(action) {
    this.history.push({
      ...action,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(this.state))
    });

    // 히스토리 크기 제한
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 액션 히스토리 반환
   * @param {number} [limit] - 제한 개수
   * @returns {StateAction[]}
   */
  getHistory(limit) {
    return limit ? this.history.slice(-limit) : [...this.history];
  }

  /**
   * 특정 시점으로 상태 복원
   * @param {number} index - 히스토리 인덱스
   */
  restoreState(index) {
    const historyItem = this.history[index];
    if (!historyItem) {
      throw new Error('Invalid history index');
    }

    this.state = JSON.parse(JSON.stringify(historyItem.state));
    this.emit('state:restored', index, historyItem);
  }

  /**
   * 배치 액션 처리
   * @param {StateAction[]} actions - 액션 배열
   */
  batch(actions) {
    if (!Array.isArray(actions)) {
      throw new TypeError('Actions must be an array');
    }

    const prevState = JSON.parse(JSON.stringify(this.state));
    
    for (const action of actions) {
      this.dispatch(action);
    }

    this.emit('state:batch', this.state, prevState, actions);
  }

  /**
   * 비동기 액션 처리
   * @param {Function} asyncAction - 비동기 액션 함수
   * @returns {Promise<any>}
   */
  async dispatchAsync(asyncAction) {
    if (typeof asyncAction !== 'function') {
      throw new TypeError('Async action must be a function');
    }

    return asyncAction(this.dispatch.bind(this), this.getState.bind(this));
  }

  /**
   * 상태 검증
   * @param {string} sliceName - 슬라이스 이름
   * @param {Function} validator - 검증 함수
   * @returns {boolean}
   */
  validate(sliceName, validator) {
    const state = this.getState(sliceName);
    return validator(state);
  }

  /**
   * 상태 변경 감지기
   * @param {string} sliceName - 슬라이스 이름
   * @param {string} property - 속성명
   * @param {Function} callback - 콜백 함수
   * @returns {Function} 해제 함수
   */
  watch(sliceName, property, callback) {
    let currentValue = this.state[sliceName]?.[property];
    
    return this.subscribe(sliceName, (newState) => {
      const newValue = newState[property];
      if (newValue !== currentValue) {
        const prevValue = currentValue;
        currentValue = newValue;
        callback(newValue, prevValue);
      }
    });
  }

  /**
   * 계산된 속성
   * @param {Function} compute - 계산 함수
   * @param {string[]} dependencies - 의존성 슬라이스 목록
   * @returns {any}
   */
  computed(compute, dependencies = []) {
    let cachedResult;
    let cachedDeps = {};
    
    const update = () => {
      const currentDeps = dependencies.reduce((deps, dep) => {
        deps[dep] = this.getState(dep);
        return deps;
      }, {});
      
      const depsChanged = dependencies.some(dep => 
        currentDeps[dep] !== cachedDeps[dep]
      );
      
      if (depsChanged || cachedResult === undefined) {
        cachedResult = compute(this.state);
        cachedDeps = currentDeps;
      }
      
      return cachedResult;
    };

    // 의존성 변경 시 재계산
    dependencies.forEach(dep => {
      this.subscribe(dep, update);
    });

    return update;
  }

  /**
   * DevTools 활성화
   * @param {boolean} enabled - 활성화 여부
   */
  enableDevTools(enabled = true) {
    this.devTools = enabled;
    
    if (enabled && window.__REDUX_DEVTOOLS_EXTENSION__) {
      window.__REDUX_DEVTOOLS_EXTENSION__.init(this.state);
    }
  }

  /**
   * 첫 글자 대문자로 변환
   * @param {string} str - 문자열
   * @returns {string}
   * @private
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 디버그 정보 출력
   */
  debug() {
    console.group('StateManager Debug');
    console.log('Current State:', this.state);
    console.log('Registered Slices:', Array.from(this.slices.keys()));
    console.log('History Length:', this.history.length);
    console.log('Middleware Count:', this.middleware.length);
    console.groupEnd();
  }

  /**
   * 상태 직렬화
   * @returns {string}
   */
  serialize() {
    return JSON.stringify({
      state: this.state,
      history: this.history
    });
  }

  /**
   * 상태 역직렬화
   * @param {string} serialized - 직렬화된 상태
   */
  deserialize(serialized) {
    try {
      const data = JSON.parse(serialized);
      this.state = data.state || {};
      this.history = data.history || [];
      this.emit('state:deserialized');
    } catch (error) {
      throw new Error('Failed to deserialize state: ' + error.message);
    }
  }
}

// 기본 미들웨어들
export const middleware = {
  /**
   * 로깅 미들웨어
   * @param {StateAction} action - 액션
   * @param {Function} getState - 상태 조회 함수
   */
  logger: (action, getState) => {
    console.group(`Action: ${action.type}`);
    console.log('Payload:', action.payload);
    console.log('State before:', getState());
    
    return action;
  },

  /**
   * 성능 측정 미들웨어
   * @param {StateAction} action - 액션
   */
  performance: (action) => {
    const start = performance.now();
    
    // 액션 완료 후 측정
    setTimeout(() => {
      const duration = performance.now() - start;
      console.log(`Action ${action.type} took ${duration.toFixed(2)}ms`);
    }, 0);
    
    return action;
  },

  /**
   * 액션 검증 미들웨어
   * @param {StateAction} action - 액션
   */
  validator: (action) => {
    if (!action.type) {
      console.error('Action must have a type', action);
      return null;
    }
    
    if (action.type.includes('@@')) {
      console.warn('Action type contains reserved characters', action);
    }
    
    return action;
  }
};
