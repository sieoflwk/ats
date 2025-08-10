/**
 * ESLint 설정 파일 (ES 모듈 방식)
 * 코드 품질과 일관성을 위한 린팅 규칙
 */

export default [
  {
    // 모든 JavaScript 파일에 적용
    files: ['**/*.js', '**/*.mjs'],
    
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // 브라우저 환경
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        PerformanceObserver: 'readonly',
        Intl: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        
        // Service Worker
        self: 'readonly',
        clients: 'readonly',
        caches: 'readonly',
        registration: 'readonly',
        
        // Node.js (빌드 도구용)
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        
        // 테스트 환경
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        
        // 커스텀 전역 변수
        __APP_VERSION__: 'readonly',
        __BUILD_TIME__: 'readonly'
      }
    },
    
    rules: {
      // === 기본 코드 품질 ===
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      
      // === 코딩 스타일 ===
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'space-before-blocks': 'error',
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'max-len': ['warn', { 
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }],
      
      // === 함수 및 클래스 ===
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'arrow-spacing': 'error',
      'arrow-parens': ['error', 'as-needed'],
      'class-methods-use-this': 'off',
      'no-useless-constructor': 'error',
      'prefer-class-methods': 'off',
      
      // === 객체 및 배열 ===
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', {
        object: true,
        array: false
      }],
      'no-array-constructor': 'error',
      'array-callback-return': 'error',
      
      // === 조건문 및 반복문 ===
      'eqeqeq': ['error', 'always'],
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-negated-condition': 'error',
      'yoda': 'error',
      'for-direction': 'error',
      'no-await-in-loop': 'warn',
      
      // === 에러 처리 ===
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',
      
      // === JSDoc ===
      'valid-jsdoc': ['warn', {
        requireReturn: false,
        requireReturnDescription: false,
        requireParamDescription: true,
        prefer: {
          returns: 'returns',
          arg: 'param',
          argument: 'param'
        }
      }],
      
      // === 보안 ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      
      // === 성능 ===
      'no-caller': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-loop-func': 'error',
      
      // === 모듈 시스템 ===
      'import/no-unresolved': 'off', // 경로 해석 관련 에러 방지
      'import/extensions': 'off'
    }
  },
  
  // Service Worker 파일 전용 설정
  {
    files: ['sw.js', '**/sw.js'],
    languageOptions: {
      globals: {
        self: 'writable',
        clients: 'readonly',
        caches: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
        importScripts: 'readonly'
      }
    },
    rules: {
      'no-restricted-globals': 'off'
    }
  },
  
  // 설정 파일들 전용 설정
  {
    files: ['*.config.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  
  // 테스트 파일 전용 설정
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
    rules: {
      'no-console': 'off',
      'max-len': 'off'
    }
  },
  
  // 제외할 파일들
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'public/**',
      'assets/**' // 레거시 assets 폴더
    ]
  }
];
