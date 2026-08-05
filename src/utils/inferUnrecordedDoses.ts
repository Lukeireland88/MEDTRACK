import type { Medication as ScheduleMedication } from './scheduleUtils';
import { isDue } from './scheduleUtils';
import { combineLocalDateWithTime, fromDateInputValue, toLocalDateKey } from './dateUtils';

export type UnrecordedDoseRow = {
  id: string;
  at: string;
  doseDate: string;
  medicationId: string;
  medicationName: string;
  kind: 'slot' | 'flexible';
  detail: string;
};

type SlotInfo = {
  id: string;
  name: string;
};

type MedForInference = ScheduleMedication & {
  dosing_mode: 'time_slots' | 'flexible_daily';
  end_date: string | null;
  slots: SlotInfo[];
};

/** Inclusive local YYYY-MM-DD keys from `from` through `to`. */
export function eachLocalDateKey(from: string, to: string): string[] {
  const keys: string[] = [];
  if (from > to) return keys;
  const cur = fromDateInputValue(from);
  const end = fromDateInputValue(to);
  while (cur <= end) {
    keys.push(toLocalDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

export function noonLocalIso(dateKey: string): string {
  return combineLocalDateWithTime(fromDateInputValue(dateKey), '12:00');
}

/**
 * Infer doses that were due but never marked taken / not taken (time slots),
 * and flexible meds with zero logs on past due days.
 */
export function inferUnrecordedDoseRows(args: {
  from: string;
  toEffective: string;
  todayLocal: string;
  medications: MedForInference[];
  /** Keys: `${medication_id}|${time_slot_id}|${dose_date}` */
  recordedSlotKeys: Set<string>;
  /** Keys: `${medication_id}|${dose_date}` → count of flexible dose events */
  flexibleDoseCounts: Map<string, number>;
  medicationFilterIds: string[];
}): UnrecordedDoseRow[] {
  const {
    from,
    toEffective,
    todayLocal,
    medications,
    recordedSlotKeys,
    flexibleDoseCounts,
    medicationFilterIds,
  } = args;

  if (from > toEffective) return [];

  const filter =
    medicationFilterIds.length > 0 ? new Set(medicationFilterIds) : null;
  const rows: UnrecordedDoseRow[] = [];

  for (const dateKey of eachLocalDateKey(from, toEffective)) {
    const dateObj = fromDateInputValue(dateKey);
    const isPast = dateKey < todayLocal;

    for (const med of medications) {
      if (filter && !filter.has(med.id)) continue;
      if (med.start_date && med.start_date > dateKey) continue;
      if (med.end_date && med.end_date < dateKey) continue;
      if (!isDue(med, dateObj)) continue;

      if (med.dosing_mode === 'flexible_daily') {
        // v1: past days only (avoid midday noise on today)
        if (!isPast) continue;
        const count = flexibleDoseCounts.get(`${med.id}|${dateKey}`) ?? 0;
        if (count > 0) continue;
        rows.push({
          id: `unrec-flex-${med.id}-${dateKey}`,
          at: noonLocalIso(dateKey),
          doseDate: dateKey,
          medicationId: med.id,
          medicationName: med.name,
          kind: 'flexible',
          detail: 'Flexible · Not recorded',
        });
        continue;
      }

      // Today included: all due sessions show as Not recorded until logged
      // (no wait for session default_after_hour).
      for (const slot of med.slots) {
        const key = `${med.id}|${slot.id}|${dateKey}`;
        if (recordedSlotKeys.has(key)) continue;
        rows.push({
          id: `unrec-${med.id}-${slot.id}-${dateKey}`,
          at: noonLocalIso(dateKey),
          doseDate: dateKey,
          medicationId: med.id,
          medicationName: med.name,
          kind: 'slot',
          detail: `${slot.name} · Not recorded`,
        });
      }
    }
  }

  return rows;
}
