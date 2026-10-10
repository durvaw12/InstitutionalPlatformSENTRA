const ApiError = require('./ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const REFERENCE_RE = /^INC-\d{4}-\d{4,}$/i;

/** Returns a trimmed string, or '' for anything that is not a string (blocks `{ "$ne": null }` style payloads). */
const asString = (v) => (typeof v === 'string' ? v.trim() : '');
const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);
/** Accepts true or "true" only (multipart form fields arrive as strings). */
const parseBool = (v) => v === true || v === 'true';
/** true / false / "true" / "false" -> boolean, anything else -> undefined. */
const parseStrictBool = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : undefined);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
const isStrongPassword = (p) =>
  typeof p === 'string' && p.length >= 8 && Buffer.byteLength(p, 'utf8') <= 72 && /\d/.test(p) && /[a-zA-Z]/.test(p);

const cleanPhone = (s = '') => String(s).trim().replace(/[^\d+]/g, '');
/** Same rules as frontend/src/utils/validation.js */
function isValidPhone(s = '') {
  const p = cleanPhone(s);
  if (!p) return false;
  if (/^\d{3,4}$/.test(p)) return true;
  if (/^1800\d{6,7}$/.test(p)) return true;
  const national = p.replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(national);
}

/** 400 error whose message is the first problem and whose `errors` maps field -> message. */
function validationError(errors) {
  const [field] = Object.keys(errors);
  return new ApiError(400, errors[field], { field, errors });
}

/**
 * Validates user fields shared by register, admin create, and profile update.
 * `require` lists fields that must be present; other fields are validated only when supplied.
 */
function validateUserFields(input, { role, require = [] } = {}) {
  const errors = {};
  const clean = {};
  const need = (k) => require.includes(k);
  const supplied = (k) => input[k] !== undefined;

  if (need('name') || supplied('name')) {
    const name = asString(input.name);
    if (name.length < 2) errors.name = 'Enter the full name.';
    else if (name.length > 100) errors.name = 'Keep the name under 100 characters.';
    clean.name = name;
  }
  if (need('email') || supplied('email')) {
    const email = asString(input.email).toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
    clean.email = email;
  }
  if (need('password') || supplied('password')) {
    if (!isStrongPassword(input.password)) errors.password = 'Use at least 8 characters, with letters and a number.';
    clean.password = input.password;
  }
  if (need('department') || supplied('department')) {
    const dep = asString(input.department);
    if (role !== 'administrator' && dep.length < 2) errors.department = 'Enter the department.';
    else if (dep.length > 100) errors.department = 'Keep the department under 100 characters.';
    clean.department = dep || null;
  }
  if (supplied('phone')) {
    const phone = asString(input.phone);
    if (phone && !isValidPhone(phone)) errors.phone = 'Enter a valid phone number, e.g. +91 98765 43210.';
    clean.phone = phone || null;
  }
  return { errors, clean };
}

module.exports = {
  EMAIL_RE,
  REFERENCE_RE,
  asString,
  isObjectIdString,
  parseBool,
  parseStrictBool,
  escapeRegex,
  isStrongPassword,
  isValidPhone,
  validationError,
  validateUserFields,
};
