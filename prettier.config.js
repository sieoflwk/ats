/**
 * Prettier 설정 파일
 * 코드 포맷팅 규칙 정의
 */

export default {
  // 기본 설정
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JavaScript/TypeScript
  jsxSingleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // HTML
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  
  // CSS
  cssEnable: true,
  
  // 줄바꿈
  endOfLine: 'lf',
  
  // 특정 파일 타입별 설정
  overrides: [
    {
      files: '*.html',
      options: {
        printWidth: 100,
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 100,
        singleQuote: false
      }
    },
    {
      files: '*.json',
      options: {
        printWidth: 80,
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    }
  ]
};
