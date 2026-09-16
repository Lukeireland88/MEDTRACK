import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('PWA and production config', () => {
  it('uses root scope and start URL without /MEDTRACK/', () => {
    const vite = readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    expect(vite).toMatch(/base:\s*'\/'/);
    expect(vite).toMatch(/start_url:\s*'\//);
    expect(vite).toMatch(/scope:\s*'\//);
    expect(vite).not.toMatch(/\/MEDTRACK\//);
    expect(vite).toMatch(/NetworkOnly/);
    expect(vite).toMatch(/sourcemap:\s*false/);
  });
});
