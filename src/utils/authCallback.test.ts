import { afterEach, describe, expect, it } from 'vitest';
import {
  EMAIL_CONFIRMED_MESSAGE,
  GENERIC_AUTH_CALLBACK_ERROR_MESSAGE,
  OTP_EXPIRED_MESSAGE,
  decodeConfirmationUrlValue,
  extractRawConfirmationUrl,
  isValidSupabaseVerifyUrl,
  noticeForAuthCallback,
  parseAuthCallbackParams,
  parseCapturedEmailConfirmation,
  resetCapturedAuthLocationForTests,
  stripAuthCallbackParamsFromHref,
  stripConfirmationUrlFromHref,
} from './authCallback';

afterEach(() => {
  resetCapturedAuthLocationForTests();
});

describe('extractRawConfirmationUrl', () => {
  it('returns the complete raw value including nested query parameters', () => {
    const search =
      '?confirmation_url=https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup&redirect_to=https://mymedsrecord.co.uk/';
    expect(extractRawConfirmationUrl(search)).toBe(
      'https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup&redirect_to=https://mymedsrecord.co.uk/'
    );
  });

  it('returns null when the parameter is absent', () => {
    expect(extractRawConfirmationUrl('?foo=bar')).toBeNull();
  });
});

describe('decodeConfirmationUrlValue', () => {
  it('decodes a percent-encoded Supabase verify URL', () => {
    const raw =
      'https%3A%2F%2Fabcd.supabase.co%2Fauth%2Fv1%2Fverify%3Ftoken%3Dabc%26type%3Dsignup';
    expect(decodeConfirmationUrlValue(raw)).toBe(
      'https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup'
    );
  });

  it('leaves an already-decoded URL unchanged', () => {
    const raw = 'https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup';
    expect(decodeConfirmationUrlValue(raw)).toBe(raw);
  });
});

describe('isValidSupabaseVerifyUrl', () => {
  it('accepts https verify URLs on supabase.co', () => {
    expect(
      isValidSupabaseVerifyUrl('https://abcdxyz.supabase.co/auth/v1/verify?token=abc&type=signup')
    ).toBe(true);
  });

  it('rejects http, non-supabase hosts, and other paths', () => {
    expect(
      isValidSupabaseVerifyUrl('http://abcdxyz.supabase.co/auth/v1/verify?token=abc')
    ).toBe(false);
    expect(isValidSupabaseVerifyUrl('https://evil.example/auth/v1/verify?token=abc')).toBe(false);
    expect(isValidSupabaseVerifyUrl('https://abcdxyz.supabase.co/auth/v1/token?token=abc')).toBe(
      false
    );
    expect(isValidSupabaseVerifyUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('parseCapturedEmailConfirmation', () => {
  it('validates a nested unencoded confirmation URL', () => {
    const parsed = parseCapturedEmailConfirmation(
      '?confirmation_url=https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup'
    );
    expect(parsed).toEqual({
      present: true,
      valid: true,
      url: 'https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup',
    });
  });

  it('marks invalid hosts as present but not valid', () => {
    const parsed = parseCapturedEmailConfirmation(
      '?confirmation_url=https://example.com/auth/v1/verify?token=abc'
    );
    expect(parsed.present).toBe(true);
    expect(parsed.valid).toBe(false);
    expect(parsed.url).toBeNull();
  });
});

describe('auth callback hash inspection', () => {
  it('builds a success notice for signup callbacks', () => {
    const inspection = parseAuthCallbackParams(
      '#access_token=secret&refresh_token=secret&type=signup',
      ''
    );
    expect(inspection.type).toBe('signup');
    expect(noticeForAuthCallback(inspection)).toEqual({
      variant: 'success',
      message: EMAIL_CONFIRMED_MESSAGE,
    });
  });

  it('uses the otp_expired copy and never surfaces the raw description', () => {
    const inspection = parseAuthCallbackParams(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      ''
    );
    expect(inspection.errorCode).toBe('otp_expired');
    expect(noticeForAuthCallback(inspection)).toEqual({
      variant: 'error',
      message: OTP_EXPIRED_MESSAGE,
    });
  });

  it('uses a friendly message for other errors', () => {
    const inspection = parseAuthCallbackParams(
      '#error=access_denied&error_code=unexpected_failure&error_description=Technical+detail',
      ''
    );
    expect(noticeForAuthCallback(inspection)).toEqual({
      variant: 'error',
      message: GENERIC_AUTH_CALLBACK_ERROR_MESSAGE,
    });
  });

  it('does not treat password recovery as email confirmation', () => {
    const inspection = parseAuthCallbackParams('#access_token=secret&type=recovery', '');
    expect(noticeForAuthCallback(inspection)).toBeNull();
  });
});

describe('URL cleanup', () => {
  it('removes confirmation_url and nested leftover search params', () => {
    const href =
      'https://mymedsrecord.co.uk/?confirmation_url=https://abcd.supabase.co/auth/v1/verify?token=abc&type=signup';
    expect(stripConfirmationUrlFromHref(href)).toBe('/');
  });

  it('removes the auth hash after it has been inspected', () => {
    const href =
      'https://mymedsrecord.co.uk/#access_token=secret&refresh_token=secret&type=signup';
    expect(stripAuthCallbackParamsFromHref(href)).toBe('/');
  });

  it('keeps unrelated query parameters', () => {
    const href = 'https://mymedsrecord.co.uk/settings?tab=account#heading';
    expect(stripAuthCallbackParamsFromHref(href)).toBe('/settings?tab=account#heading');
  });
});
