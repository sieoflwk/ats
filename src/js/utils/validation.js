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


