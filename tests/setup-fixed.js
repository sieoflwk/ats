/**
 * Jest 테스트 환경 설정 (수정된 버전)
 * 테스트 실행 전 필요한 전역 설정과 모의 객체들을 준비
 */

// DOM 환경 설정
import 'jest-environment-jsdom';

// 전역 fetch 모의 (jsdom에서 기본 제공하지 않음)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Fetch API 모의
global.fetch = jest.fn();

// 로컬 스토리지 모의
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
global.localStorage = localStorageMock;

// 세션 스토리지 모의
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
global.sessionStorage = sessionStorageMock;

// Intersection Observer 모의
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Resize Observer 모의
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mutation Observer 모의
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Performance API 모의
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// matchMedia 모의
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// CSS 관련 모의
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  })
});

// 스크롤 관련 모의
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scrollTo = jest.fn();
window.scrollTo = jest.fn();

// 파일 관련 모의
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties?.type || '';
    this.lastModified = properties?.lastModified || Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = file.parts.join('');
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type};base64,${btoa(file.parts.join(''))}`;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
};

// URL 관련 모의
global.URL = class MockURL {
  constructor(url, base) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.protocol = 'http:';
    this.host = 'localhost:3000';
    this.hostname = 'localhost';
    this.port = '3000';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
  
  static createObjectURL() {
    return 'mock-object-url';
  }
  
  static revokeObjectURL() {
    // mock implementation
  }
};

// FormData 모의
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    this.data.set(key, value);
  }
  
  get(key) {
    return this.data.get(key);
  }
  
  has(key) {
    return this.data.has(key);
  }
  
  delete(key) {
    this.data.delete(key);
  }
};

// CustomEvent 모의 (더 완전한 구현)
if (!global.CustomEvent) {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.detail = eventInitDict.detail;
    }
  };
}

// Canvas 관련 모의
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn()
});

// Service Worker 관련 모의
global.navigator.serviceWorker = {
  register: jest.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: null
  }),
  ready: Promise.resolve({
    installing: null,
    waiting: null,
    active: null
  }),
  controller: null
};

// 알림 API 모의
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn().mockResolvedValue('granted')
};

// 클립보드 API 모의
global.navigator.clipboard = {
  writeText: jest.fn().mockResolvedValue(),
  readText: jest.fn().mockResolvedValue('')
};

// 지오로케이션 API 모의
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// 테스트 전역 헬퍼 함수들
global.testHelpers = {
  // DOM 요소 생성 헬퍼
  createElement: (tagName, options = {}) => {
    const element = document.createElement(tagName);
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    return element;
  },
  
  // 이벤트 시뮬레이션
  fireEvent: (element, eventType, eventInit = {}) => {
    const event = new Event(eventType, eventInit);
    element.dispatchEvent(event);
    return event;
  },
  
  // 비동기 테스트 대기
  waitFor: (fn, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        try {
          const result = fn();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime >= timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 10);
          }
        } catch (error) {
          if (Date.now() - startTime >= timeout) {
            reject(error);
          } else {
            setTimeout(check, 10);
          }
        }
      };
      
      check();
    });
  },
  
  // 모의 데이터 생성
  createMockCandidate: (overrides = {}) => ({
    id: 'test-candidate-1',
    name: '홍길동',
    email: 'hong@example.com',
    phone: '010-1234-5678',
    position: '프론트엔드 개발자',
    status: '신규',
    skills: ['JavaScript', 'React'],
    appliedDate: '2024-01-01',
    score: 85,
    ...overrides
  }),
  
  createMockJob: (overrides = {}) => ({
    id: 'test-job-1',
    title: '프론트엔드 개발자',
    department: '개발팀',
    positions: 1,
    experience: '3년 이상',
    deadline: '2024-12-31',
    status: '진행중',
    skills: ['JavaScript', 'React', 'Vue'],
    ...overrides
  }),
  
  createMockInterview: (overrides = {}) => ({
    id: 'test-interview-1',
    candidateId: 'test-candidate-1',
    candidateName: '홍길동',
    position: '프론트엔드 개발자',
    type: '1차면접',
    date: '2024-01-15',
    time: '14:00',
    duration: 60,
    interviewer: '김면접관',
    location: '회의실 A',
    status: '예정',
    ...overrides
  })
};

// 테스트 후 정리
afterEach(() => {
  // 모든 모의 함수 호출 기록 초기화
  jest.clearAllMocks();
  
  // DOM 초기화
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // 로컬/세션 스토리지 초기화
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // 전역 상태 초기화
  window.location.hash = '';
});

// 콘솔 에러/경고 숨기기 (테스트 중에는)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
