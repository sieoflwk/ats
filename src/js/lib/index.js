/**
 * @fileoverview 공통 라이브러리 통합 모듈
 * 자주 사용되는 유틸리티들을 하나의 네임스페이스로 통합
 */

// Core utilities
export { default as EventEmitter } from './core/event-emitter.js';
export { default as StateManager } from './core/state-manager.js';
export { default as Logger } from './core/logger.js';

// DOM utilities
export * as DOM from './dom/index.js';

// Data utilities
export * as Data from './data/index.js';

// UI utilities
export * as UI from './ui/index.js';

// Form utilities
export * as Form from './form/index.js';

// Storage utilities
export * as Storage from './storage/index.js';

// Network utilities
export * as Network from './network/index.js';

// Date/Time utilities
export * as DateTime from './datetime/index.js';

// File utilities
export * as File from './file/index.js';

// Validation utilities
export * as Validation from './validation/index.js';

// Performance utilities
export { getLazyLoader } from './performance/lazy-loader.js';

// Security utilities
export * as Security from './security/index.js';

// Accessibility utilities
export * as A11y from './accessibility/index.js';
