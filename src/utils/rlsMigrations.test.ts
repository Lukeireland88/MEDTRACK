import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const USER_DATA_TABLES = [
  'medications',
  'time_slots',
  'medication_slots',
  'doses_taken',
  'medication_logs',
  'medication_dose_events',
  'symptom_events',
  'timeline_events',
  'medication_course_periods',
  'medication_pause_periods',
  'user_settings',
] as const;

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations');

function allMigrationSql(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(path.join(migrationsDir, name), 'utf8'))
    .join('\n\n');
}

function collapsed(sql: string): string {
  return sql.replace(/\s+/g, ' ');
}

describe('RLS migrations (static)', () => {
  const sql = allMigrationSql();
  const compact = collapsed(sql);

  it('enables RLS on every user-data table', () => {
    for (const table of USER_DATA_TABLES) {
      const literal =
        compact.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`) ||
        compact.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      const viaFormat = compact.includes('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY');
      expect(literal || viaFormat, `${table} must enable RLS`).toBe(true);
    }
  });

  it('defines owner-scoped ALL policies with USING and WITH CHECK', () => {
    for (const table of USER_DATA_TABLES) {
      const policy = sql.match(
        new RegExp(`CREATE POLICY "[^"]+"\\s+ON ${table} FOR ALL TO authenticated[\\s\\S]*?;`, 'i')
      );
      expect(policy, `missing authenticated ALL policy for ${table}`).toBeTruthy();
      expect(policy?.[0]).toMatch(/USING \(/);
      expect(policy?.[0]).toMatch(/WITH CHECK \(/);
      expect(policy?.[0]).toMatch(/auth\.uid\(\)/);
    }
  });

  it('revokes anon access to user-data tables', () => {
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.%I FROM anon/);
  });

  it('delete_own_account uses auth.uid and is not granted to anon', () => {
    const fn = sql.match(/CREATE OR REPLACE FUNCTION public\.delete_own_account\(\)[\s\S]*?\$\$;/g);
    expect(fn && fn.length > 0).toBe(true);
    const latest = fn![fn!.length - 1];
    expect(latest).toMatch(/uid uuid := auth\.uid\(\)/);
    expect(latest).not.toMatch(/user_id\s+uuid/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.delete_own_account\(\) FROM PUBLIC, anon/);
  });
});

describe('live two-account RLS', () => {
  const configured = Boolean(process.env.RLS_TEST_USER_A_EMAIL && process.env.RLS_TEST_USER_B_EMAIL);

  it.skipIf(!configured)('is configured only for a dedicated test project, never production', () => {
    expect(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL).not.toMatch(/mymedsrecord/i);
  });
});
