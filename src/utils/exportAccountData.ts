import { supabase } from '../lib/supabase';
import { toLocalDateKey } from './dateUtils';

export const EXPORT_SCHEMA_VERSION = 1;
export const ACCOUNT_TABLES = [
  'medications',
  'time_slots',
  'medication_slots',
  'doses_taken',
  'medication_logs',
  'medication_dose_events',
  'medication_course_periods',
  'medication_pause_periods',
  'symptom_events',
  'timeline_events',
] as const;

const ROOT_TABLES_WITH_USER_ID = new Set([
  'medications',
  'time_slots',
  'symptom_events',
  'timeline_events',
]);

const SENSITIVE_KEY = /password|access_token|refresh_token|secret|api[_-]?key/i;

const PAGE_SIZE = 1000;

export function accountExportFilename(date = new Date()): string {
  return `my-meds-record-export-${toLocalDateKey(date)}.json`;
}

export function sanitizeExportedRows(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) continue;
      next[key] = value;
    }
    return next;
  });
}

export function buildAccountExportPayload(input: {
  exportedAt: string;
  accountEmail: string | null;
  tables: Record<string, unknown[]>;
}) {
  return {
    app: 'My Meds Record',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: input.exportedAt,
    accountEmail: input.accountEmail,
    tables: input.tables,
  };
}

async function fetchAllRows(
  table: (typeof ACCOUNT_TABLES)[number],
  userId: string
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let from = 0;

  while (true) {
    const base = supabase.from(table).select('*');
    const query = ROOT_TABLES_WITH_USER_ID.has(table) ? base.eq('user_id', userId) : base;
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message || `Could not read ${table}`);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return sanitizeExportedRows(rows);
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadAccountDataExport(): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('You must be signed in to download your data.');
  }

  const tables: Record<string, unknown[]> = {};
  for (const table of ACCOUNT_TABLES) {
    tables[table] = await fetchAllRows(table, authData.user.id);
  }

  const payload = buildAccountExportPayload({
    exportedAt: new Date().toISOString(),
    accountEmail: authData.user.email ?? null,
    tables,
  });

  downloadJson(accountExportFilename(), payload);
}
