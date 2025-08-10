/**
 * @param {string} email
 * @returns {string|null} error message or null
 */
export function validateEmail(email) {
  if (!email) return '이메일은 필수입니다.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '이메일 형식이 올바르지 않습니다.';
  return null;
}

/**
 * @param {Record<string, any>} fields
 * @returns {string[]} errors
 */
export function requireFields(fields) {
  const errors = [];
  Object.entries(fields).forEach(([k,v]) => {
    if (v == null || String(v).trim() === '') errors.push(`${k}은(는) 필수입니다.`);
  });
  return errors;
}

/**
 * @param {string} phone
 * @returns {string|null} error message or null
 */
export function validatePhone(phone) {
  if (!phone) return null; // optional field
  if (!/^[\d\-\+\(\)\s]+$/.test(phone)) return '전화번호 형식이 올바르지 않습니다.';
  return null;
}

/**
 * @param {string} date
 * @returns {string|null} error message or null
 */
export function validateFutureDate(date) {
  if (!date) return null;
  if (new Date(date) < new Date()) return '미래 날짜를 선택해주세요.';
  return null;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {string|null} error message or null
 */
export function validateRange(value, min, max) {
  if (value < min || value > max) return `${min}에서 ${max} 사이의 값을 입력해주세요.`;
  return null;
}

/**
 * @param {string} text
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {string|null} error message or null
 */
export function validateLength(text, minLength, maxLength = Infinity) {
  if (!text) return null;
  const len = text.trim().length;
  if (len < minLength) return `최소 ${minLength}글자 이상 입력해주세요.`;
  if (len > maxLength) return `최대 ${maxLength}글자까지 입력 가능합니다.`;
  return null;
}

/**
 * 파일 크기 및 형식 검증
 * @param {File} file
 * @param {string[]} allowedTypes
 * @param {number} maxSizeMB
 * @returns {string|null} error message or null
 */
export function validateFile(file, allowedTypes = [], maxSizeMB = 10) {
  if (!file) return null;
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `허용된 파일 형식: ${allowedTypes.join(', ')}`;
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
  }
  
  return null;
}


