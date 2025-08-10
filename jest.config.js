/**
 * Jest 테스트 설정 파일
 * 단위 테스트 및 통합 테스트 환경 설정
 */

export default {
  // 테스트 환경
  testEnvironment: 'jsdom',
  
  // 루트 디렉토리
  rootDir: '.',
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,mjs}',
    '<rootDir>/src/**/*.{test,spec}.{js,mjs}',
    '<rootDir>/tests/**/*.{test,spec}.{js,mjs}'
  ],
  
  // 테스트에서 제외할 파일들
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/assets/' // 레거시 assets 폴더
  ],
  
  // 모듈 경로 매핑 (Vite 설정과 동일)
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@js/(.*)$': '<rootDir>/src/js/$1',
    '^@css/(.*)$': '<rootDir>/src/assets/css/$1',
    '^@components/(.*)$': '<rootDir>/src/js/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/js/pages/$1',
    '^@utils/(.*)$': '<rootDir>/src/js/utils/$1',
    '^@lib/(.*)$': '<rootDir>/src/js/lib/$1',
    '^@types/(.*)$': '<rootDir>/src/js/types/$1'
  },
  
  // 변환 설정
  transform: {
    '^.+\\.(js|mjs)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['js', 'mjs', 'json'],
  
  // setup 파일
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 전역 설정
  globals: {
    __APP_VERSION__: '1.0.0',
    __BUILD_TIME__: '2024-01-01T00:00:00.000Z'
  },
  
  // 커버리지 설정
  collectCoverage: true,
  collectCoverageFrom: [
    'src/js/**/*.{js,mjs}',
    '!src/js/**/*.test.{js,mjs}',
    '!src/js/**/*.spec.{js,mjs}',
    '!src/js/**/__tests__/**',
    '!src/js/main.js', // 엔트리 파일 제외
    '!src/js/config/**', // 설정 파일 제외
    '!src/js/data/fixtures/**' // 테스트 데이터 제외
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 모의(Mock) 설정
  clearMocks: true,
  restoreMocks: true,
  
  // 타임아웃 설정
  testTimeout: 10000,
  
  // 병렬 실행 설정
  maxWorkers: '50%',
  
  // 캐시 디렉토리
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Verbose 출력
  verbose: true,
  
  // 테스트 실행 전/후 스크립트
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // 모듈 해석 설정
  resolver: undefined,
  
  // Watch 모드 설정
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // 에러 처리
  errorOnDeprecated: true,
  
  // 스냅샷 설정
  snapshotSerializers: [],
  
  // 테스트 결과 보고서
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage',
      filename: 'test-report.html',
      expand: true
    }]
  ]
};
