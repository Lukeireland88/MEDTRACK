/** Frontend minimum. Supabase Auth must also be set to 8 characters in the Dashboard. */
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_LENGTH_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

export const PASSWORD_LENGTH_HINT = `Use at least ${MIN_PASSWORD_LENGTH} characters. A longer password you can remember is better than a short, complicated one.`;

export function passwordMeetsMinimumLength(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
