/** Shared validators and dummy-number helpers, so every form accepts and formats phone numbers the same way. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dummy numbers used for demo data and form placeholders. Not real lines. */
export const DUMMY_MOBILE = '+91 98765 43210';
export const DUMMY_MOBILE_ALT = '+91 98765 43211';

/** Strips spaces, dashes and brackets, keeping a leading + and digits only. */
export const cleanPhone = (s = '') => s.trim().replace(/[^\d+]/g, '');

/**
 * Accepts the formats used in this app:
 *  - 10-digit mobile starting 6-9, optionally written +91 / 91 / 0 first, with spaces or dashes
 *  - short emergency codes (3-4 digits, e.g. 112, 1091)
 *  - toll-free 1800 numbers (1800-180-5522)
 */
export function isValidPhone(s = '') {
  const p = cleanPhone(s);
  if (!p) return false;
  if (/^\d{3,4}$/.test(p)) return true;
  if (/^1800\d{6,7}$/.test(p)) return true;
  const national = p.replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(national);
}

/** Value for a tel: link. */
export const telHref = (s = '') => `tel:${cleanPhone(s)}`;

export const isStrongPassword = (p) => p.length >= 8 && /\d/.test(p) && /[a-zA-Z]/.test(p);
