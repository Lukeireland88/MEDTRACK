import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_TABLES,
  accountExportFilename,
  buildAccountExportPayload,
  sanitizeExportedRows,
} from './exportAccountData';

describe('account data export', () => {
  it('names the file with my-meds-record and the local date', () => {
    expect(accountExportFilename(new Date(2026, 8, 16))).toBe('my-meds-record-export-2026-09-16.json');
  });

  it('includes a schema version and timestamp and omits credentials', () => {
    const payload = buildAccountExportPayload({
      exportedAt: '2026-09-16T12:00:00.000Z',
      accountEmail: 'user@example.com',
      tables: { medications: [{ id: '1', name: 'Tablet' }] },
    });
    expect(payload.schemaVersion).toBe(1);
    expect(payload.exportedAt).toBe('2026-09-16T12:00:00.000Z');
    expect(JSON.stringify(payload)).not.toMatch(/access_token|refresh_token|password|service_role/i);
    expect(ACCOUNT_TABLES).toEqual(
      expect.arrayContaining([
        'medications',
        'time_slots',
        'doses_taken',
        'medication_logs',
        'medication_dose_events',
        'symptom_events',
        'timeline_events',
      ])
    );
  });

  it('strips password and token fields from rows', () => {
    const rows = sanitizeExportedRows([
      { name: 'Tablet', password: 'secret', access_token: 'tok', notes: 'ok' },
    ]);
    expect(rows).toEqual([{ name: 'Tablet', notes: 'ok' }]);
  });
});
