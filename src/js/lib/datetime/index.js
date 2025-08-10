/**
 * @fileoverview 날짜/시간 관련 유틸리티
 * 날짜 포맷팅, 계산, 파싱, 상대시간 등
 */

/**
 * 날짜 포맷팅 유틸리티
 */
export const format = {
  /**
   * 날짜를 지정된 형식으로 포맷팅
   * @param {Date|string|number} date - 날짜
   * @param {string} pattern - 패턴
   * @param {string} locale - 로케일
   * @returns {string}
   */
  date(date, pattern = 'YYYY-MM-DD', locale = 'ko-KR') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const tokens = {
      YYYY: d.getFullYear(),
      YY: d.getFullYear().toString().slice(-2),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      M: d.getMonth() + 1,
      DD: String(d.getDate()).padStart(2, '0'),
      D: d.getDate(),
      HH: String(d.getHours()).padStart(2, '0'),
      H: d.getHours(),
      mm: String(d.getMinutes()).padStart(2, '0'),
      m: d.getMinutes(),
      ss: String(d.getSeconds()).padStart(2, '0'),
      s: d.getSeconds(),
      SSS: String(d.getMilliseconds()).padStart(3, '0')
    };

    let result = pattern;
    Object.entries(tokens).forEach(([token, value]) => {
      result = result.replace(new RegExp(token, 'g'), value);
    });

    return result;
  },

  /**
   * 상대시간 포맷팅 (예: "2시간 전")
   * @param {Date|string|number} date - 날짜
   * @param {string} locale - 로케일
   * @returns {string}
   */
  relative(date, locale = 'ko-KR') {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const units = {
      'ko-KR': {
        year: '년 전',
        month: '개월 전',
        day: '일 전',
        hour: '시간 전',
        minute: '분 전',
        second: '초 전',
        now: '방금',
        future: {
          year: '년 후',
          month: '개월 후',
          day: '일 후',
          hour: '시간 후',
          minute: '분 후',
          second: '초 후'
        }
      },
      'en-US': {
        year: ' year ago',
        month: ' month ago',
        day: ' day ago',
        hour: ' hour ago',
        minute: ' minute ago',
        second: ' second ago',
        now: 'just now',
        future: {
          year: ' year from now',
          month: ' month from now',
          day: ' day from now',
          hour: ' hour from now',
          minute: ' minute from now',
          second: ' second from now'
        }
      }
    };

    const localizedUnits = units[locale] || units['ko-KR'];
    const isFuture = diffMs < 0;
    const absDiffSeconds = Math.abs(diffSeconds);
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);
    const absDiffMonths = Math.abs(diffMonths);
    const absDiffYears = Math.abs(diffYears);

    if (absDiffSeconds < 60) {
      if (absDiffSeconds < 10) return localizedUnits.now;
      const unit = isFuture ? localizedUnits.future.second : localizedUnits.second;
      return absDiffSeconds + unit;
    } else if (absDiffMinutes < 60) {
      const unit = isFuture ? localizedUnits.future.minute : localizedUnits.minute;
      return absDiffMinutes + unit;
    } else if (absDiffHours < 24) {
      const unit = isFuture ? localizedUnits.future.hour : localizedUnits.hour;
      return absDiffHours + unit;
    } else if (absDiffDays < 30) {
      const unit = isFuture ? localizedUnits.future.day : localizedUnits.day;
      return absDiffDays + unit;
    } else if (absDiffMonths < 12) {
      const unit = isFuture ? localizedUnits.future.month : localizedUnits.month;
      return absDiffMonths + unit;
    } else {
      const unit = isFuture ? localizedUnits.future.year : localizedUnits.year;
      return absDiffYears + unit;
    }
  },

  /**
   * 시간 구간 포맷팅
   * @param {Date} start - 시작 시간
   * @param {Date} end - 종료 시간
   * @param {string} locale - 로케일
   * @returns {string}
   */
  duration(start, end, locale = 'ko-KR') {
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const units = {
      'ko-KR': { day: '일', hour: '시간', minute: '분' },
      'en-US': { day: ' day', hour: ' hour', minute: ' min' }
    };

    const localizedUnits = units[locale] || units['ko-KR'];

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      if (remainingHours > 0) {
        return `${diffDays}${localizedUnits.day} ${remainingHours}${localizedUnits.hour}`;
      }
      return `${diffDays}${localizedUnits.day}`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}${localizedUnits.hour} ${remainingMinutes}${localizedUnits.minute}`;
      }
      return `${diffHours}${localizedUnits.hour}`;
    } else {
      return `${diffMinutes}${localizedUnits.minute}`;
    }
  }
};

/**
 * 날짜 계산 유틸리티
 */
export const calc = {
  /**
   * 날짜에 기간 추가
   * @param {Date} date - 기준 날짜
   * @param {number} amount - 양
   * @param {string} unit - 단위 (years, months, days, hours, minutes, seconds)
   * @returns {Date}
   */
  add(date, amount, unit) {
    const result = new Date(date);
    
    switch (unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
    }
    
    return result;
  },

  /**
   * 날짜에서 기간 빼기
   * @param {Date} date - 기준 날짜
   * @param {number} amount - 양
   * @param {string} unit - 단위
   * @returns {Date}
   */
  subtract(date, amount, unit) {
    return this.add(date, -amount, unit);
  },

  /**
   * 두 날짜 간의 차이 계산
   * @param {Date} date1 - 날짜 1
   * @param {Date} date2 - 날짜 2
   * @param {string} unit - 단위
   * @returns {number}
   */
  diff(date1, date2, unit = 'days') {
    const diffMs = date2.getTime() - date1.getTime();
    
    switch (unit) {
      case 'years':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
      case 'months':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'milliseconds':
        return diffMs;
      default:
        return diffMs;
    }
  },

  /**
   * 주의 시작일 구하기
   * @param {Date} date - 기준 날짜
   * @param {number} startOfWeek - 주 시작일 (0=일요일, 1=월요일)
   * @returns {Date}
   */
  startOfWeek(date, startOfWeek = 1) {
    const result = new Date(date);
    const dayOfWeek = result.getDay();
    const diff = (dayOfWeek - startOfWeek + 7) % 7;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * 월의 시작일 구하기
   * @param {Date} date - 기준 날짜
   * @returns {Date}
   */
  startOfMonth(date) {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * 월의 마지막일 구하기
   * @param {Date} date - 기준 날짜
   * @returns {Date}
   */
  endOfMonth(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }
};

/**
 * 날짜 검증 유틸리티
 */
export const validate = {
  /**
   * 유효한 날짜인지 확인
   * @param {any} date - 확인할 값
   * @returns {boolean}
   */
  isValid(date) {
    const d = new Date(date);
    return !isNaN(d.getTime());
  },

  /**
   * 날짜 범위 확인
   * @param {Date} date - 확인할 날짜
   * @param {Date} min - 최소 날짜
   * @param {Date} max - 최대 날짜
   * @returns {boolean}
   */
  isInRange(date, min, max) {
    const d = new Date(date);
    const minDate = new Date(min);
    const maxDate = new Date(max);
    
    return d >= minDate && d <= maxDate;
  },

  /**
   * 미래 날짜인지 확인
   * @param {Date} date - 확인할 날짜
   * @returns {boolean}
   */
  isFuture(date) {
    return new Date(date) > new Date();
  },

  /**
   * 과거 날짜인지 확인
   * @param {Date} date - 확인할 날짜
   * @returns {boolean}
   */
  isPast(date) {
    return new Date(date) < new Date();
  },

  /**
   * 오늘인지 확인
   * @param {Date} date - 확인할 날짜
   * @returns {boolean}
   */
  isToday(date) {
    const d = new Date(date);
    const today = new Date();
    
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  },

  /**
   * 주말인지 확인
   * @param {Date} date - 확인할 날짜
   * @returns {boolean}
   */
  isWeekend(date) {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 일요일 또는 토요일
  }
};

/**
 * 날짜 파싱 유틸리티
 */
export const parse = {
  /**
   * 문자열을 날짜로 파싱
   * @param {string} dateString - 날짜 문자열
   * @param {string} format - 형식
   * @returns {Date|null}
   */
  fromString(dateString, format = 'YYYY-MM-DD') {
    try {
      // 간단한 파싱 (실제로는 더 정교한 파싱 라이브러리 사용 권장)
      if (format === 'YYYY-MM-DD') {
        const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          const [, year, month, day] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // ISO 형식 시도
      const isoDate = new Date(dateString);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * ISO 문자열을 로컬 날짜로 변환
   * @param {string} isoString - ISO 문자열
   * @returns {Date}
   */
  fromISO(isoString) {
    return new Date(isoString);
  },

  /**
   * 타임스탬프를 날짜로 변환
   * @param {number} timestamp - 타임스탬프 (초 또는 밀리초)
   * @returns {Date}
   */
  fromTimestamp(timestamp) {
    // 10자리면 초, 13자리면 밀리초로 가정
    const ts = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    return new Date(ts);
  }
};

/**
 * 타임존 유틸리티
 */
export const timezone = {
  /**
   * 현재 타임존 오프셋 구하기 (분)
   * @returns {number}
   */
  getCurrentOffset() {
    return new Date().getTimezoneOffset();
  },

  /**
   * 현재 타임존 이름 구하기
   * @returns {string}
   */
  getCurrentName() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  /**
   * UTC로 변환
   * @param {Date} date - 로컬 날짜
   * @returns {Date}
   */
  toUTC(date) {
    const utc = new Date(date);
    utc.setMinutes(utc.getMinutes() + utc.getTimezoneOffset());
    return utc;
  },

  /**
   * UTC에서 로컬로 변환
   * @param {Date} utcDate - UTC 날짜
   * @returns {Date}
   */
  fromUTC(utcDate) {
    const local = new Date(utcDate);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local;
  }
};

/**
 * 업무일 계산 유틸리티
 */
export const business = {
  /**
   * 업무일인지 확인 (주말 제외)
   * @param {Date} date - 확인할 날짜
   * @param {number[]} weekends - 주말 요일 배열 (기본: [0, 6])
   * @returns {boolean}
   */
  isBusinessDay(date, weekends = [0, 6]) {
    const dayOfWeek = new Date(date).getDay();
    return !weekends.includes(dayOfWeek);
  },

  /**
   * 업무일 추가
   * @param {Date} date - 기준 날짜
   * @param {number} days - 추가할 업무일 수
   * @param {number[]} weekends - 주말 요일 배열
   * @returns {Date}
   */
  addBusinessDays(date, days, weekends = [0, 6]) {
    let result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (this.isBusinessDay(result, weekends)) {
        addedDays++;
      }
    }

    return result;
  },

  /**
   * 두 날짜 간의 업무일 수 계산
   * @param {Date} start - 시작 날짜
   * @param {Date} end - 종료 날짜
   * @param {number[]} weekends - 주말 요일 배열
   * @returns {number}
   */
  countBusinessDays(start, end, weekends = [0, 6]) {
    let count = 0;
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      if (this.isBusinessDay(current, weekends)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
};

/**
 * 현재 시각 정보
 * @returns {Object}
 */
export function now() {
  const current = new Date();
  
  return {
    date: current,
    timestamp: current.getTime(),
    iso: current.toISOString(),
    formatted: format.date(current, 'YYYY-MM-DD HH:mm:ss'),
    timezone: timezone.getCurrentName(),
    offset: timezone.getCurrentOffset()
  };
}
