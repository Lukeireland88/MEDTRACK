import { supabase } from '../lib/supabase';
import { toLocalDateKey } from './dateUtils';

const ACCOUNT_TABLES = [
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

const PAGE_SIZE = 1000;

async function fetchAllRows(table: (typeof ACCOUNT_TABLES)[number]): Promise<unknown[]> {
  const rows: unknown[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message || `Could not read ${table}`);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
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

export async function downloadAccountDataExport(email: string | undefined): Promise<void> {
  const tables: Record<string, unknown[]> = {};
  for (const table of ACCOUNT_TABLES) {
    tables[table] = await fetchAllRows(table);
  }

  const payload = {
    app: 'My Meds Record',
    exportedAt: new Date().toISOString(),
    accountEmail: email ?? null,
    tables,
  };

  downloadJson(`my-meds-record-export-${toLocalDateKey(new Date())}.json`, payload);
}
