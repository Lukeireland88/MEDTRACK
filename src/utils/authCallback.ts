export const EMAIL_CONFIRMED_MESSAGE =
  'Email confirmed successfully. Your account is ready.';

export const OTP_EXPIRED_MESSAGE =
  'This confirmation link has expired or has already been used. Try signing in — your email may already be confirmed.';

export const GENERIC_AUTH_CALLBACK_ERROR_MESSAGE =
  'We could not confirm your email. Please try signing in, or request a new confirmation link if you still cannot access your account.';

export const INVALID_CONFIRMATION_LINK_MESSAGE = 'This confirmation link is invalid.';

export const INVALID_RECOVERY_LINK_MESSAGE = 'This password reset link is invalid.';

const CONFIRMATION_URL_MARKER = 'confirmation_url=';

const AUTH_HASH_KEYS = [
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'provider_token',
  'provider_refresh_token',
  'token_type',
  'type',
  'error',
  'error_code',
  'error_description',
] as const;

const AUTH_SEARCH_KEYS = ['code', 'error', 'error_code', 'error_description'] as const;

export const SUCCESS_AUTH_TYPES = new Set(['signup', 'email', 'invite', 'email_change', 'magiclink']);

export type AuthCallbackInspection = {
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  type: string | null;
};

export type AuthCallbackNotice = {
  variant: 'success' | 'error';
  message: string;
};

export type WrappedAuthPurpose = 'signup' | 'recovery' | 'other';

export type CapturedEmailConfirmation = {
  present: boolean;
  valid: boolean;
  url: string | null;
  purpose: WrappedAuthPurpose;
};

type LocationSnapshot = {
  search: string;
  hash: string;
  href: string;
};

let locationSnapshot: LocationSnapshot | null = null;

function currentWindowLocation(): LocationSnapshot | null {
  if (typeof window === 'undefined') return null;
  return {
    search: window.location.search,
    hash: window.location.hash,
    href: window.location.href,
  };
}

/** Capture the first-seen address so React Strict Mode remounts still have the original auth params. */
export function captureInitialAuthLocation(location = currentWindowLocation()): LocationSnapshot | null {
  if (!locationSnapshot && location) {
    locationSnapshot = location;
  }
  return locationSnapshot;
}

export function getCapturedAuthLocation(): LocationSnapshot | null {
  return locationSnapshot;
}

/** Test helper — not used by the app. */
export function resetCapturedAuthLocationForTests(): void {
  locationSnapshot = null;
}

/**
 * Read the complete raw value after `confirmation_url=` so nested Supabase query
 * parameters are not truncated by URLSearchParams.
 */
export function extractRawConfirmationUrl(search: string): string | null {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const index = query.indexOf(CONFIRMATION_URL_MARKER);
  if (index === -1) return null;
  return query.slice(index + CONFIRMATION_URL_MARKER.length);
}

export function decodeConfirmationUrlValue(raw: string): string {
  let current = raw.trim().replace(/\+/g, ' ');
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

export function isValidSupabaseVerifyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (!host.endsWith('.supabase.co')) return false;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    return path === '/auth/v1/verify';
  } catch {
    return false;
  }
}

export function purposeFromSupabaseVerifyUrl(value: string): WrappedAuthPurpose {
  try {
    const type = new URL(value).searchParams.get('type');
    if (type === 'recovery') return 'recovery';
    if (
      type === 'signup' ||
      type === 'email' ||
      type === 'invite' ||
      type === 'email_change' ||
      type === 'magiclink'
    ) {
      return 'signup';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

export function parseCapturedEmailConfirmation(search: string): CapturedEmailConfirmation {
  const raw = extractRawConfirmationUrl(search);
  if (raw === null) {
    return { present: false, valid: false, url: null, purpose: 'other' };
  }
  if (!raw.trim()) {
    return { present: true, valid: false, url: null, purpose: 'other' };
  }
  const decoded = decodeConfirmationUrlValue(raw);
  const purpose = purposeFromSupabaseVerifyUrl(decoded);
  if (!isValidSupabaseVerifyUrl(decoded)) {
    return { present: true, valid: false, url: null, purpose };
  }
  return { present: true, valid: true, url: decoded, purpose };
}

export function parseAuthCallbackParams(hash: string, search = ''): AuthCallbackInspection {
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const read = (key: string) => {
    const fromHash = hashParams.get(key);
    if (fromHash !== null && fromHash !== '') return fromHash;
    const fromSearch = searchParams.get(key);
    if (fromSearch !== null && fromSearch !== '') return fromSearch;
    return null;
  };

  return {
    error: read('error'),
    errorCode: read('error_code'),
    errorDescription: read('error_description'),
    type: read('type'),
  };
}

/** sessionStorage so a refresh cannot drop the reset gate while the recovery session still exists. */
export const PASSWORD_RECOVERY_STORAGE_KEY = 'mmr-password-recovery-pending';

export function persistPasswordRecoveryPending(pending: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (pending) sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, '1');
    else sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

export function readPasswordRecoveryPending(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isPasswordRecoveryCallback(hash: string, search = ''): boolean {
  return parseAuthCallbackParams(hash, search).type === 'recovery';
}

export function initialPasswordRecoveryPending(): boolean {
  const captured = captureInitialAuthLocation();
  if (isPasswordRecoveryCallback(captured?.hash ?? '', captured?.search ?? '')) {
    persistPasswordRecoveryPending(true);
    return true;
  }
  return readPasswordRecoveryPending();
}

export function noticeForAuthCallback(inspection: AuthCallbackInspection): AuthCallbackNotice | null {
  if (inspection.error || inspection.errorCode || inspection.errorDescription) {
    if (inspection.errorCode === 'otp_expired') {
      return { variant: 'error', message: OTP_EXPIRED_MESSAGE };
    }
    return { variant: 'error', message: GENERIC_AUTH_CALLBACK_ERROR_MESSAGE };
  }

  if (inspection.type && SUCCESS_AUTH_TYPES.has(inspection.type)) {
    return { variant: 'success', message: EMAIL_CONFIRMED_MESSAGE };
  }

  return null;
}

export function stripConfirmationUrlFromHref(href: string): string {
  const url = new URL(href);
  const query = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  const index = query.indexOf(CONFIRMATION_URL_MARKER);
  if (index === -1) {
    return `${url.pathname}${url.search}${url.hash}`;
  }
  const before = query.slice(0, index).replace(/&$/, '');
  url.search = before ? `?${before}` : '';
  return `${url.pathname}${url.search}${url.hash}`;
}

export function hasAuthFragment(hash: string): boolean {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return AUTH_HASH_KEYS.some((key) => params.has(key));
}

export function stripAuthCallbackParamsFromHref(href: string): string {
  const url = new URL(href);
  if (hasAuthFragment(url.hash)) {
    url.hash = '';
  }
  for (const key of AUTH_SEARCH_KEYS) {
    url.searchParams.delete(key);
  }
  const query = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  if (query.includes(CONFIRMATION_URL_MARKER)) {
    return stripConfirmationUrlFromHref(url.toString());
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function stripConfirmationUrlFromAddressBar(): void {
  if (typeof window === 'undefined') return;
  const next = stripConfirmationUrlFromHref(window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}

export function stripAuthCallbackFromAddressBar(): void {
  if (typeof window === 'undefined') return;
  const next = stripAuthCallbackParamsFromHref(window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}
