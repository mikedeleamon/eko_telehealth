// Shared input formatting + validation helpers for forms.

// ---- Phone / fax ----

/**
 * Lenient international sanitizer used as the user types: keeps a single
 * leading "+" plus digits, spaces, dashes and parentheses. Works for both
 * Nigerian (0803…) and diaspora (+1…, +44…) numbers.
 */
export function sanitizePhoneInput(raw: string): string {
  let out = raw.replace(/[^\d+\s()-]/g, '');
  // Only one "+", and only at the very start.
  out = out.replace(/\+/g, (m, offset) => (offset === 0 ? '+' : ''));
  return out;
}

/** True once there are 10–15 digits (the "+" and separators don't count). */
export function isValidPhone(v: string): boolean {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// ---- Dates (DD-MM-YYYY) ----

export const DATE_RE = /^(\d{2})-(\d{2})-(\d{4})$/;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Masks free typing into DD-MM-YYYY, inserting the dashes automatically and
 * capping at 8 digits. Lets the field accept manual entry while keeping the
 * one canonical format the calendar picker also produces.
 */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (digits.length > 2) out += '-' + mm;
  if (digits.length > 4) out += '-' + yyyy;
  return out;
}

/** Parses a DD-MM-YYYY string into a Date, or null if it isn't a real date. */
export function parseDMY(v: string): Date | null {
  const m = DATE_RE.exec(v.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Rejects overflow like 31-02-2020 (which JS would roll into March).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

/** Formats a Date as DD-MM-YYYY. */
export function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/**
 * Validates a DD-MM-YYYY string. For dates of birth pass allowFuture:false so
 * a future birthday (or an implausible year) is rejected.
 */
export function isValidDate(v: string, opts: { allowFuture?: boolean } = {}): boolean {
  const d = parseDMY(v);
  if (!d) return false;
  const year = d.getFullYear();
  if (year < 1900) return false;
  if (opts.allowFuture === false) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d.getTime() > today.getTime()) return false;
  }
  return true;
}

export { MONTH_NAMES };

// ---- Money ----

/** Groups an integer with thousands separators without relying on Intl (Hermes). */
export function groupThousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Splits a display fee string (e.g. "₦15,000") into its numeric amount and the
 * currency symbol/prefix so amounts can be recomputed (deductions, take-home)
 * and re-formatted in the same currency. Returns null when there's no number.
 */
export function splitFee(fee: string): { symbol: string; amount: number } | null {
  const digits = fee.replace(/[^\d]/g, '');
  if (!digits) return null;
  // Everything before the first digit is the currency prefix (e.g. "₦", "$").
  const symbol = fee.slice(0, fee.search(/\d/)).trim();
  return { symbol, amount: parseInt(digits, 10) };
}

/** Formats an amount back into a display string with the given currency prefix. */
export function formatMoney(symbol: string, amount: number): string {
  return `${symbol}${groupThousands(amount)}`;
}
