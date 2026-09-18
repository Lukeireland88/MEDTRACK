import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const templatesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/email-templates'
);

const WRAP =
  'https://mymedsrecord.co.uk/?confirmation_url={{ .ConfirmationURL }}';

describe('auth email templates', () => {
  it('wraps confirm-signup links on the first-party domain', () => {
    const html = readFileSync(path.join(templatesDir, 'confirm-signup.html'), 'utf8');
    expect(html).toContain(`href="${WRAP}"`);
    expect(html).toContain(WRAP);
  });

  it('wraps reset-password button and fallback URL on the first-party domain', () => {
    const html = readFileSync(path.join(templatesDir, 'reset-password.html'), 'utf8');
    expect(html).toContain(`href="${WRAP}"`);
    expect(html.match(new RegExp(WRAP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))?.length).toBeGreaterThanOrEqual(
      2
    );
    expect(html).not.toMatch(/href="\{\{ \.ConfirmationURL \}\}"/);
  });
});
