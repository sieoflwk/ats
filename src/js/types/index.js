/**
 * @fileoverview 전역 타입 정의 및 인터페이스
 * TypeScript 스타일의 JSDoc을 사용하여 타입 안전성 확보
 */

/**
 * 기본 엔티티 타입
 * @typedef {Object} BaseEntity
 * @property {string|null} id - 고유 식별자
 * @property {string} createdAt - 생성일시 (ISO 8601)
 * @property {string} updatedAt - 수정일시 (ISO 8601)
 */

/**
 * 지원자 엔티티
 * @typedef {BaseEntity} Candidate
 * @property {string} name - 지원자 이름
 * @property {string} email - 이메일 주소
 * @property {string} phone - 전화번호
 * @property {string} position - 지원 직무
 * @property {CandidateStatus} status - 지원 상태
 * @property {string[]} skills - 보유 기술
 * @property {string} appliedDate - 지원일 (YYYY-MM-DD)
 * @property {number} score - 평가 점수 (0-100)
 * @property {string} avatar - 아바타 이모지
 * @property {CandidateEvaluation} evaluations - 상세 평가
 * @property {CandidateHistory[]} history - 지원자 이력
 * @property {FileInfo|null} resume - 이력서 파일
 */

/**
 * 지원자 상태 열거형
 * @typedef {'신규'|'서류검토'|'서류통과'|'면접대기'|'면접진행'|'최종검토'|'최종합격'|'불합격'|'보류'} CandidateStatus
 */

/**
 * 지원자 평가 정보
 * @typedef {Object} CandidateEvaluation
 * @property {number} overall - 종합 평가 (0-100)
 * @property {number} technical - 기술 평가 (0-100)
 * @property {number} communication - 소통 능력 (0-100)
 * @property {number} problemSolving - 문제 해결 능력 (0-100)
 * @property {number} teamwork - 팀워크 (0-100)
 * @property {string} notes - 평가 메모
 */

/**
 * 지원자 이력 항목
 * @typedef {Object} CandidateHistory
 * @property {string} date - 일시 (ISO 8601)
 * @property {string} action - 액션 타입
 * @property {string} description - 설명
 * @property {string} [actor] - 수행자
 */

/**
 * 채용공고 엔티티
 * @typedef {BaseEntity} Job
 * @property {string} title - 공고 제목
 * @property {string} department - 부서명
 * @property {number} positions - 채용인원
 * @property {string} experience - 경력 요구사항
 * @property {string} deadline - 마감일 (YYYY-MM-DD)
 * @property {JobStatus} status - 공고 상태
 * @property {string[]} skills - 요구 기술
 * @property {string} description - 상세 설명
 * @property {string} requirements - 자격 요건
 * @property {string} benefits - 복리후생
 * @property {string} location - 근무지
 * @property {EmploymentType} employmentType - 고용 형태
 * @property {string} salary - 급여 정보
 */

/**
 * 채용공고 상태
 * @typedef {'진행중'|'마감'|'임시저장'} JobStatus
 */

/**
 * 고용 형태
 * @typedef {'정규직'|'계약직'|'인턴'|'프리랜서'} EmploymentType
 */

/**
 * 면접 엔티티
 * @typedef {BaseEntity} Interview
 * @property {string} candidateId - 지원자 ID
 * @property {string} candidateName - 지원자 이름
 * @property {string} position - 지원 직무
 * @property {InterviewType} type - 면접 유형
 * @property {string} date - 면접 날짜 (YYYY-MM-DD)
 * @property {string} time - 면접 시간 (HH:mm)
 * @property {number} duration - 소요 시간 (분)
 * @property {string} interviewer - 면접관
 * @property {string} location - 면접 장소
 * @property {InterviewStatus} status - 면접 상태
 * @property {string} notes - 메모
 * @property {string} meetingLink - 온라인 미팅 링크
 * @property {string} feedback - 면접 피드백
 * @property {number} score - 면접 점수 (0-100)
 */

/**
 * 면접 유형
 * @typedef {'1차면접'|'2차면접'|'최종면접'|'전화면접'|'화상면접'|'기술면접'|'인성면접'} InterviewType
 */

/**
 * 면접 상태
 * @typedef {'예정'|'진행중'|'완료'|'취소'|'연기'} InterviewStatus
 */

/**
 * 파일 정보
 * @typedef {Object} FileInfo
 * @property {string} name - 파일명
 * @property {string} dataUrl - Data URL
 * @property {number} size - 파일 크기 (bytes)
 * @property {string} type - MIME 타입
 * @property {string} uploadedAt - 업로드 일시
 */

/**
 * API 응답 타입
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 성공 여부
 * @property {T} [data] - 응답 데이터
 * @property {string} [message] - 메시지
 * @property {ApiError} [error] - 에러 정보
 */

/**
 * API 에러 타입
 * @typedef {Object} ApiError
 * @property {number} code - 에러 코드
 * @property {string} message - 에러 메시지
 * @property {string} [details] - 상세 정보
 * @property {string} [field] - 관련 필드명
 */

/**
 * 페이지네이션 정보
 * @typedef {Object} PaginationInfo
 * @property {number} page - 현재 페이지 (1-based)
 * @property {number} limit - 페이지 크기
 * @property {number} total - 전체 항목 수
 * @property {number} totalPages - 전체 페이지 수
 * @property {boolean} hasNext - 다음 페이지 존재 여부
 * @property {boolean} hasPrev - 이전 페이지 존재 여부
 */

/**
 * 검색 결과 타입
 * @template T
 * @typedef {Object} SearchResult
 * @property {T[]} data - 검색된 데이터
 * @property {PaginationInfo} pagination - 페이지네이션 정보
 * @property {SearchMeta} meta - 검색 메타데이터
 */

/**
 * 검색 메타데이터
 * @typedef {Object} SearchMeta
 * @property {number} total - 전체 항목 수
 * @property {number} filtered - 필터링된 항목 수
 * @property {string} searchQuery - 검색 쿼리
 * @property {Array<[string, any]>} activeFilters - 활성 필터
 * @property {string|null} sortField - 정렬 필드
 * @property {'asc'|'desc'} sortDirection - 정렬 방향
 */

/**
 * 컴포넌트 옵션 기본 타입
 * @typedef {Object} ComponentOptions
 * @property {HTMLElement} container - 컨테이너 엘리먼트
 * @property {string} [className] - 추가 CSS 클래스
 * @property {boolean} [disabled] - 비활성화 여부
 * @property {Object} [data] - 초기 데이터
 */

/**
 * 이벤트 핸들러 타입
 * @template T
 * @typedef {function(T): void|Promise<void>} EventHandler
 */

/**
 * 생명주기 메서드 인터페이스
 * @typedef {Object} Lifecycle
 * @property {function(): void|Promise<void>} [init] - 초기화
 * @property {function(): void|Promise<void>} [render] - 렌더링
 * @property {function(): void|Promise<void>} [destroy] - 정리
 * @property {function(): void|Promise<void>} [update] - 업데이트
 */

/**
 * 캘린더 이벤트 타입
 * @typedef {Object} CalendarEvent
 * @property {string} id - 이벤트 ID
 * @property {string} title - 제목
 * @property {string} date - 날짜 (YYYY-MM-DD)
 * @property {string} [time] - 시간 (HH:mm)
 * @property {number} [duration] - 지속 시간 (분)
 * @property {string} [type] - 이벤트 타입
 * @property {string} [description] - 설명
 * @property {Object} [data] - 추가 데이터
 */

/**
 * 차트 데이터 포인트
 * @typedef {Object} ChartDataPoint
 * @property {string} label - 라벨
 * @property {number} value - 값
 * @property {string} [color] - 색상
 * @property {string} [date] - 날짜 (시계열 데이터)
 */

/**
 * 국제화 번역 키
 * @typedef {string} I18nKey
 */

/**
 * 국제화 매개변수
 * @typedef {Object.<string, string|number>} I18nParams
 */

/**
 * 로케일 정보
 * @typedef {Object} LocaleInfo
 * @property {string} name - 언어명
 * @property {string} nativeName - 원어 언어명
 * @property {'ltr'|'rtl'} direction - 텍스트 방향
 */

/**
 * 검증 규칙
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - 필수 입력
 * @property {number} [minLength] - 최소 길이
 * @property {number} [maxLength] - 최대 길이
 * @property {number} [min] - 최소값
 * @property {number} [max] - 최대값
 * @property {RegExp|string} [pattern] - 패턴
 * @property {function(any): boolean} [custom] - 커스텀 검증
 * @property {string} [message] - 에러 메시지
 */

/**
 * 검증 결과
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 유효성 여부
 * @property {string[]} errors - 에러 메시지 배열
 * @property {Object.<string, string[]>} fieldErrors - 필드별 에러
 */

/**
 * 저장소 어댑터 인터페이스
 * @typedef {Object} StorageAdapter
 * @property {function(string): any} get - 데이터 조회
 * @property {function(string, any): void} set - 데이터 저장
 * @property {function(string): void} remove - 데이터 삭제
 * @property {function(): void} clear - 전체 삭제
 * @property {function(): string[]} keys - 키 목록
 */

/**
 * 라우터 설정
 * @typedef {Object} RouterConfig
 * @property {string} defaultPage - 기본 페이지
 * @property {string} notFoundPage - 404 페이지
 * @property {Object.<string, RouteHandler>} routes - 라우트 맵
 */

/**
 * 라우트 핸들러
 * @typedef {function(RouteContext): void|Promise<void>} RouteHandler
 */

/**
 * 라우트 컨텍스트
 * @typedef {Object} RouteContext
 * @property {string} path - 경로
 * @property {URLSearchParams} params - 쿼리 매개변수
 * @property {Object} state - 상태 데이터
 */

/**
 * 앱 설정
 * @typedef {Object} AppConfig
 * @property {string} version - 앱 버전
 * @property {string} apiUrl - API 기본 URL
 * @property {boolean} debug - 디버그 모드
 * @property {string} defaultLocale - 기본 언어
 * @property {string[]} supportedLocales - 지원 언어 목록
 * @property {Object} features - 기능 플래그
 */

// 타입 검증 유틸리티
export const Types = {
  /**
   * 지원자 타입 검증
   * @param {any} obj 
   * @returns {obj is Candidate}
   */
  isCandidate(obj) {
    return obj && typeof obj === 'object' &&
           typeof obj.name === 'string' &&
           typeof obj.email === 'string' &&
           typeof obj.position === 'string' &&
           typeof obj.status === 'string';
  },

  /**
   * 채용공고 타입 검증
   * @param {any} obj 
   * @returns {obj is Job}
   */
  isJob(obj) {
    return obj && typeof obj === 'object' &&
           typeof obj.title === 'string' &&
           typeof obj.department === 'string' &&
           typeof obj.positions === 'number' &&
           typeof obj.status === 'string';
  },

  /**
   * 면접 타입 검증
   * @param {any} obj 
   * @returns {obj is Interview}
   */
  isInterview(obj) {
    return obj && typeof obj === 'object' &&
           typeof obj.candidateId === 'string' &&
           typeof obj.date === 'string' &&
           typeof obj.time === 'string' &&
           typeof obj.status === 'string';
  },

  /**
   * API 응답 타입 검증
   * @template T
   * @param {any} obj 
   * @returns {obj is ApiResponse<T>}
   */
  isApiResponse(obj) {
    return obj && typeof obj === 'object' &&
           typeof obj.success === 'boolean';
  }
};

// 상수 정의
export const Constants = {
  // 지원자 상태
  CANDIDATE_STATUS: {
    NEW: '신규',
    REVIEW: '서류검토',
    PASSED: '서류통과',
    INTERVIEW_WAITING: '면접대기',
    INTERVIEW_PROGRESS: '면접진행',
    FINAL_REVIEW: '최종검토',
    HIRED: '최종합격',
    REJECTED: '불합격',
    ON_HOLD: '보류'
  },

  // 채용공고 상태
  JOB_STATUS: {
    ACTIVE: '진행중',
    CLOSED: '마감',
    DRAFT: '임시저장'
  },

  // 면접 상태
  INTERVIEW_STATUS: {
    SCHEDULED: '예정',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
    CANCELLED: '취소',
    POSTPONED: '연기'
  },

  // 면접 유형
  INTERVIEW_TYPE: {
    FIRST: '1차면접',
    SECOND: '2차면접',
    FINAL: '최종면접',
    PHONE: '전화면접',
    VIDEO: '화상면접',
    TECHNICAL: '기술면접',
    PERSONALITY: '인성면접'
  },

  // 고용 형태
  EMPLOYMENT_TYPE: {
    FULL_TIME: '정규직',
    CONTRACT: '계약직',
    INTERN: '인턴',
    FREELANCER: '프리랜서'
  },

  // 파일 타입
  FILE_TYPES: {
    PDF: 'application/pdf',
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    TXT: 'text/plain',
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    GIF: 'image/gif'
  },

  // 검증 패턴
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\-\+\(\)\s]+$/,
    DATE: /^\d{4}-\d{2}-\d{2}$/,
    TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },

  // 제한값
  LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5,
    MAX_SEARCH_RESULTS: 100,
    MAX_CACHE_SIZE: 50,
    PAGE_SIZE: 20
  }
};

// 기본 에러 메시지
export const ErrorMessages = {
  REQUIRED: '필수 입력 항목입니다.',
  INVALID_EMAIL: '올바른 이메일 주소를 입력하세요.',
  INVALID_PHONE: '올바른 전화번호를 입력하세요.',
  INVALID_DATE: '올바른 날짜를 입력하세요.',
  INVALID_TIME: '올바른 시간을 입력하세요.',
  MIN_LENGTH: '최소 {min}글자 이상 입력하세요.',
  MAX_LENGTH: '최대 {max}글자까지 입력 가능합니다.',
  MIN_VALUE: '최소값은 {min}입니다.',
  MAX_VALUE: '최대값은 {max}입니다.',
  FILE_TOO_LARGE: '파일 크기는 {max}MB 이하여야 합니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  NOT_FOUND: '요청한 항목을 찾을 수 없습니다.',
  UNAUTHORIZED: '권한이 없습니다.',
  SESSION_EXPIRED: '세션이 만료되었습니다.'
};
