// Lightweight server-side input validation for form endpoints.
// Treats client-side validation as a hint, not a guarantee.

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RX.test(v);
}

export function nonEmptyString(v: unknown, max = 2000): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

export function optionalString(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return trimmed.slice(0, max);
  return trimmed;
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  if (typeof v !== 'string') return null;
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function checkboxToInt(v: FormDataEntryValue | null): 0 | 1 {
  if (v === null) return 0;
  if (typeof v === 'string' && (v === 'on' || v === 'true' || v === '1')) return 1;
  return 0;
}

export function clientIp(request: Request): string | null {
  return request.headers.get('cf-connecting-ip') || null;
}

export function userAgent(request: Request): string | null {
  const ua = request.headers.get('user-agent');
  return ua ? ua.slice(0, 500) : null;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// Generic / consumer mailbox providers. We FLAG these (never block) so that
// legitimate angels and family-office principals using personal addresses are
// not turned away — generic submissions are simply tagged for manual triage.
const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'gmx.com', 'gmx.net', 'mail.com', 'zoho.com',
  'yandex.com', 'yandex.ru', 'qq.com', '163.com', '126.com',
  'rediffmail.com',
]);

/** Lowercased domain part of an email, or null if not parseable. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const d = email.slice(at + 1).trim().toLowerCase();
  return d || null;
}

/** Classify an email domain as 'generic' (consumer) or 'corporate'. Never used to reject. */
export function classifyEmailDomain(email: string): { domain: string | null; type: 'generic' | 'corporate' } {
  const domain = emailDomain(email);
  if (!domain) return { domain: null, type: 'generic' };
  return { domain, type: GENERIC_EMAIL_DOMAINS.has(domain) ? 'generic' : 'corporate' };
}
