/**
 * 국제화(i18n) 시스템
 */

export class I18n {
  constructor(options = {}) {
    this.options = {
      defaultLocale: 'ko',
      fallbackLocale: 'en',
      debug: false,
      ...options
    };
    
    this.currentLocale = this.options.defaultLocale;
    this.translations = new Map();
    this.formatters = new Map();
    this.observers = [];
    
    this.init();
  }

  init() {
    // 브라우저 언어 감지
    this.detectLocale();
    
    // 기본 번역 로드
    this.loadDefaultTranslations();
    
    // 포매터 설정
    this.setupFormatters();
  }

  detectLocale() {
    // URL 파라미터에서 언어 확인
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    // 로컬 스토리지에서 저장된 언어 확인
    const savedLang = localStorage.getItem('preferred-language');
    
    // 브라우저 언어 확인
    const browserLang = navigator.language.split('-')[0];
    
    // 우선순위: URL > 저장된 설정 > 브라우저 언어 > 기본값
    this.currentLocale = urlLang || savedLang || browserLang || this.options.defaultLocale;
    
    // 지원하지 않는 언어면 기본값 사용
    if (!this.isLocaleSupported(this.currentLocale)) {
      this.currentLocale = this.options.defaultLocale;
    }
  }

  isLocaleSupported(locale) {
    const supportedLocales = ['ko', 'en', 'ja', 'zh'];
    return supportedLocales.includes(locale);
  }

  loadDefaultTranslations() {
    // 한국어 (기본)
    this.translations.set('ko', {
      // 공통
      common: {
        save: '저장',
        cancel: '취소',
        delete: '삭제',
        edit: '편집',
        add: '추가',
        search: '검색',
        filter: '필터',
        loading: '로딩 중...',
        error: '오류',
        success: '성공',
        warning: '경고',
        info: '정보',
        confirm: '확인',
        yes: '예',
        no: '아니오',
        close: '닫기',
        back: '뒤로',
        next: '다음',
        previous: '이전',
        today: '오늘',
        yesterday: '어제',
        tomorrow: '내일',
        thisWeek: '이번 주',
        thisMonth: '이번 달',
        thisYear: '올해'
      },
      
      // 네비게이션
      nav: {
        dashboard: '대시보드',
        candidates: '지원자 관리',
        jobs: '채용공고',
        interviews: '면접 관리',
        reports: '리포트',
        analytics: '성과 지표',
        settings: '설정'
      },
      
      // 대시보드
      dashboard: {
        title: '대시보드',
        newCandidate: '새 지원자',
        totalCandidates: '전체 지원자',
        activeCandidates: '진행 중 지원자',
        activeJobs: '진행 중 채용공고',
        todayInterviews: '오늘 면접',
        conversionRate: '전환율',
        monthlyApplications: '월별 지원자 추이',
        statusDistribution: '상태별 분포'
      },
      
      // 지원자
      candidates: {
        title: '지원자 관리',
        name: '이름',
        email: '이메일',
        phone: '전화번호',
        position: '지원 직무',
        status: '상태',
        appliedDate: '지원일',
        score: '점수',
        skills: '기술',
        resume: '이력서',
        newCandidate: '새 지원자',
        editCandidate: '지원자 편집',
        candidateDetails: '지원자 상세정보',
        statusNew: '신규',
        statusReview: '서류검토',
        statusPassed: '서류통과',
        statusInterview: '면접대기',
        statusFinal: '최종검토',
        statusHired: '최종합격',
        statusRejected: '불합격',
        statusOnHold: '보류'
      },
      
      // 채용공고
      jobs: {
        title: '채용공고',
        jobTitle: '제목',
        department: '부서',
        positions: '채용인원',
        experience: '경력',
        deadline: '마감일',
        description: '상세설명',
        requirements: '자격요건',
        benefits: '복리후생',
        location: '근무지',
        employmentType: '고용형태',
        salary: '급여',
        newJob: '새 채용공고',
        editJob: '채용공고 편집',
        statusActive: '진행중',
        statusClosed: '마감',
        statusDraft: '임시저장'
      },
      
      // 면접
      interviews: {
        title: '면접 관리',
        candidate: '지원자',
        date: '날짜',
        time: '시간',
        duration: '소요시간',
        interviewer: '면접관',
        location: '장소',
        type: '면접 유형',
        notes: '메모',
        feedback: '피드백',
        newInterview: '새 면접 일정',
        editInterview: '면접 일정 편집',
        scheduleInterview: '면접 예약',
        statusScheduled: '예정',
        statusCompleted: '완료',
        statusCancelled: '취소',
        typeFirstRound: '1차면접',
        typeSecondRound: '2차면접',
        typeFinal: '최종면접',
        typePhone: '전화면접',
        typeVideo: '화상면접'
      },
      
      // 폼 검증
      validation: {
        required: '필수 입력 항목입니다.',
        email: '올바른 이메일 주소를 입력하세요.',
        phone: '올바른 전화번호를 입력하세요.',
        minLength: '최소 {min}글자 이상 입력하세요.',
        maxLength: '최대 {max}글자까지 입력 가능합니다.',
        minValue: '최소값은 {min}입니다.',
        maxValue: '최대값은 {max}입니다.',
        invalidDate: '올바른 날짜를 입력하세요.',
        pastDate: '현재 날짜 이후를 선택하세요.',
        fileSize: '파일 크기는 {max}MB 이하여야 합니다.',
        fileType: '지원하지 않는 파일 형식입니다.'
      },
      
      // 메시지
      messages: {
        saveSuccess: '성공적으로 저장되었습니다.',
        deleteSuccess: '성공적으로 삭제되었습니다.',
        deleteConfirm: '정말 삭제하시겠습니까?',
        unsavedChanges: '저장하지 않은 변경사항이 있습니다.',
        networkError: '네트워크 오류가 발생했습니다.',
        serverError: '서버 오류가 발생했습니다.',
        notFound: '요청한 항목을 찾을 수 없습니다.',
        unauthorized: '권한이 없습니다.',
        sessionExpired: '세션이 만료되었습니다.'
      }
    });

    // 영어
    this.translations.set('en', {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        today: 'Today',
        yesterday: 'Yesterday',
        tomorrow: 'Tomorrow',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        thisYear: 'This Year'
      },
      
      nav: {
        dashboard: 'Dashboard',
        candidates: 'Candidates',
        jobs: 'Jobs',
        interviews: 'Interviews',
        reports: 'Reports',
        analytics: 'Analytics',
        settings: 'Settings'
      },
      
      dashboard: {
        title: 'Dashboard',
        newCandidate: 'New Candidate',
        totalCandidates: 'Total Candidates',
        activeCandidates: 'Active Candidates',
        activeJobs: 'Active Jobs',
        todayInterviews: "Today's Interviews",
        conversionRate: 'Conversion Rate',
        monthlyApplications: 'Monthly Applications',
        statusDistribution: 'Status Distribution'
      },
      
      candidates: {
        title: 'Candidates',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        position: 'Position',
        status: 'Status',
        appliedDate: 'Applied Date',
        score: 'Score',
        skills: 'Skills',
        resume: 'Resume',
        newCandidate: 'New Candidate',
        editCandidate: 'Edit Candidate',
        candidateDetails: 'Candidate Details',
        statusNew: 'New',
        statusReview: 'Under Review',
        statusPassed: 'Passed',
        statusInterview: 'Interview',
        statusFinal: 'Final Review',
        statusHired: 'Hired',
        statusRejected: 'Rejected',
        statusOnHold: 'On Hold'
      }
      // ... 다른 섹션들도 영어로 번역
    });
  }

  setupFormatters() {
    // 날짜 포매터
    this.formatters.set('date', (value, locale) => {
      return new Date(value).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    this.formatters.set('shortDate', (value, locale) => {
      return new Date(value).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    });

    this.formatters.set('time', (value, locale) => {
      return new Date(value).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // 숫자 포매터
    this.formatters.set('number', (value, locale) => {
      return new Intl.NumberFormat(locale).format(value);
    });

    this.formatters.set('currency', (value, locale, currency = 'KRW') => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    });

    this.formatters.set('percent', (value, locale) => {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1
      }).format(value / 100);
    });

    // 상대 시간 포매터
    this.formatters.set('relative', (value, locale) => {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const date = new Date(value);
      const now = new Date();
      const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
      
      if (Math.abs(diffInDays) < 1) {
        const diffInHours = Math.floor((date - now) / (1000 * 60 * 60));
        return rtf.format(diffInHours, 'hour');
      }
      
      return rtf.format(diffInDays, 'day');
    });
  }

  // 번역 함수
  t(key, params = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;
    const translations = this.translations.get(targetLocale) || 
                        this.translations.get(this.options.fallbackLocale);
    
    if (!translations) {
      if (this.options.debug) {
        console.warn(`No translations found for locale: ${targetLocale}`);
      }
      return key;
    }

    const value = this.getNestedValue(translations, key);
    
    if (value === undefined) {
      if (this.options.debug) {
        console.warn(`Translation key not found: ${key} (locale: ${targetLocale})`);
      }
      return key;
    }

    return this.interpolate(value, params);
  }

  // 중첩된 키 값 가져오기
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // 문자열 보간
  interpolate(template, params) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  }

  // 복수형 처리
  plural(key, count, params = {}, locale = null) {
    const rules = this.getPluralRules(locale || this.currentLocale);
    const rule = rules.select(count);
    
    const pluralKey = `${key}.${rule}`;
    const fallbackKey = `${key}.other`;
    
    const translation = this.t(pluralKey, { count, ...params }, locale) ||
                       this.t(fallbackKey, { count, ...params }, locale) ||
                       this.t(key, { count, ...params }, locale);
    
    return translation;
  }

  getPluralRules(locale) {
    try {
      return new Intl.PluralRules(locale);
    } catch (e) {
      return new Intl.PluralRules('en');
    }
  }

  // 포맷팅
  format(type, value, locale = null, ...args) {
    const formatter = this.formatters.get(type);
    if (!formatter) {
      if (this.options.debug) {
        console.warn(`Formatter not found: ${type}`);
      }
      return value;
    }

    try {
      return formatter(value, locale || this.currentLocale, ...args);
    } catch (e) {
      if (this.options.debug) {
        console.error(`Formatting error:`, e);
      }
      return value;
    }
  }

  // 언어 변경
  setLocale(locale) {
    if (!this.isLocaleSupported(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const oldLocale = this.currentLocale;
    this.currentLocale = locale;
    
    // 로컬 스토리지에 저장
    localStorage.setItem('preferred-language', locale);
    
    // URL 업데이트
    const url = new URL(window.location);
    url.searchParams.set('lang', locale);
    window.history.replaceState({}, '', url);
    
    // DOM 업데이트
    this.updateDOM();
    
    // 관찰자들에게 알림
    this.notifyObservers(locale, oldLocale);
  }

  // DOM 업데이트
  updateDOM() {
    // HTML lang 속성 업데이트
    document.documentElement.lang = this.currentLocale;
    
    // data-i18n 속성을 가진 요소들 업데이트
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const params = element.dataset.i18nParams ? 
        JSON.parse(element.dataset.i18nParams) : {};
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = this.t(key, params);
        } else {
          element.placeholder = this.t(key, params);
        }
      } else {
        element.textContent = this.t(key, params);
      }
    });

    // data-i18n-attr 속성을 가진 요소들의 속성 업데이트
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrConfig = JSON.parse(element.dataset.i18nAttr);
      Object.entries(attrConfig).forEach(([attr, key]) => {
        element.setAttribute(attr, this.t(key));
      });
    });
  }

  // 관찰자 패턴
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  notifyObservers(newLocale, oldLocale) {
    this.observers.forEach(callback => {
      try {
        callback(newLocale, oldLocale);
      } catch (e) {
        console.error('Observer error:', e);
      }
    });
  }

  // 번역 추가/업데이트
  addTranslations(locale, translations) {
    const existing = this.translations.get(locale) || {};
    this.translations.set(locale, this.deepMerge(existing, translations));
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  // 현재 언어 정보
  getCurrentLocale() {
    return this.currentLocale;
  }

  getSupportedLocales() {
    return Array.from(this.translations.keys());
  }

  getLocaleInfo(locale = null) {
    const targetLocale = locale || this.currentLocale;
    
    const localeInfo = {
      ko: { name: '한국어', nativeName: '한국어', direction: 'ltr' },
      en: { name: 'English', nativeName: 'English', direction: 'ltr' },
      ja: { name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
      zh: { name: 'Chinese', nativeName: '中文', direction: 'ltr' }
    };
    
    return localeInfo[targetLocale] || localeInfo.en;
  }

  // 비동기 번역 로딩
  async loadTranslations(locale, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`);
      }
      
      const translations = await response.json();
      this.addTranslations(locale, translations);
      
      return translations;
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      throw error;
    }
  }
}

// 전역 인스턴스
let globalI18n = null;

// 편의 함수들
export function createI18n(options = {}) {
  globalI18n = new I18n(options);
  return globalI18n;
}

export function getI18n() {
  if (!globalI18n) {
    globalI18n = new I18n();
  }
  return globalI18n;
}

export function t(key, params, locale) {
  return getI18n().t(key, params, locale);
}

export function format(type, value, locale, ...args) {
  return getI18n().format(type, value, locale, ...args);
}

export function setLocale(locale) {
  return getI18n().setLocale(locale);
}

// DOM에 자동으로 번역 적용하는 유틸리티
export function translateDOM(container = document) {
  getI18n().updateDOM();
}

// 언어 선택 컴포넌트를 위한 헬퍼
export function createLanguageSelector(container, options = {}) {
  const i18n = getI18n();
  const currentLocale = i18n.getCurrentLocale();
  const supportedLocales = i18n.getSupportedLocales();
  
  const select = document.createElement('select');
  select.className = options.className || 'language-selector form-select';
  select.setAttribute('aria-label', 'Language selection');
  
  supportedLocales.forEach(locale => {
    const option = document.createElement('option');
    option.value = locale;
    option.textContent = i18n.getLocaleInfo(locale).nativeName;
    option.selected = locale === currentLocale;
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    i18n.setLocale(e.target.value);
  });
  
  container.appendChild(select);
  return select;
}
