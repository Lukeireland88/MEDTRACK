import { describe, expect, it } from 'vitest';
import { MIN_PASSWORD_LENGTH, passwordMeetsMinimumLength } from './passwordPolicy';

describe('passwordPolicy', () => {
  it('requires at least eight characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(passwordMeetsMinimumLength('1234567')).toBe(false);
    expect(passwordMeetsMinimumLength('12345678')).toBe(true);
  });
});
