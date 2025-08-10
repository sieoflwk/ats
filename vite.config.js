/**
 * Vite 설정 파일
 * 개발 서버, 빌드, 번들링 최적화 설정
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 루트 디렉토리
  root: '.',
  
  // 기본 경로
  base: '/',
  
  // 개발 서버 설정
  server: {
    port: 3000,
    open: true,
    cors: true,
    host: true
  },
  
  // 빌드 설정
  build: {
    // 출력 디렉토리
    outDir: 'dist',
    
    // 소스맵 생성
    sourcemap: true,
    
    // 번들 크기 분석
    reportCompressedSize: true,
    
    // 청크 크기 경고 임계값 (KB)
    chunkSizeWarningLimit: 1000,
    
    // Rollup 옵션
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dashboard.html'),
        login: resolve(__dirname, 'login.html')
      },
      
      output: {
        // 청크 분할 전략
        manualChunks: {
          // 벤더 라이브러리
          vendor: ['./src/js/lib/index.js'],
          
          // 컴포넌트
          components: [
            './src/js/components/calendar.js',
            './src/js/components/charts.js',
            './src/js/components/file-upload.js'
          ],
          
          // 페이지별 코드
          dashboard: ['./src/js/pages/dashboard/dashboard-controller.js'],
          candidates: ['./src/js/pages/candidates/candidate-controller.js'],
          jobs: ['./src/js/pages/jobs/job-controller.js'],
          interviews: ['./src/js/pages/interviews/interview-controller.js']
        },
        
        // 파일명 패턴
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // 압축 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // CSS 설정
  css: {
    // PostCSS 설정
    postcss: {
      plugins: [
        // 필요시 autoprefixer, cssnano 등 추가
      ]
    },
    
    // CSS 모듈 설정
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // 에일리어스 설정
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'src/js'),
      '@css': resolve(__dirname, 'src/assets/css'),
      '@components': resolve(__dirname, 'src/js/components'),
      '@pages': resolve(__dirname, 'src/js/pages'),
      '@utils': resolve(__dirname, 'src/js/utils'),
      '@lib': resolve(__dirname, 'src/js/lib'),
      '@types': resolve(__dirname, 'src/js/types')
    }
  },
  
  // 플러그인
  plugins: [
    // PWA 플러그인
    {
      name: 'pwa-assets',
      generateBundle() {
        // manifest.json과 sw.js 복사
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify({
            name: '워크플로우 ATS',
            short_name: 'ATS',
            start_url: '/',
            display: 'standalone',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            icons: [
              {
                src: 'icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }, null, 2)
        });
      }
    }
  ],
  
  // 최적화 설정
  optimizeDeps: {
    include: [
      // 사전 번들링할 의존성들
    ],
    exclude: [
      // 번들링에서 제외할 의존성들
    ]
  },
  
  // 환경 변수
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // 프리뷰 서버 설정
  preview: {
    port: 4173,
    open: true
  }
});
