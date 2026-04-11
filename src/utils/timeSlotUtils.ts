import type { TimeSlot } from '../types';

/** Sort slot names using the order defined in `definitions` (DB sort_order). Unknown names sort last, alphabetically. */
export function sortMedicationSlotNames(names: string[], definitions: TimeSlot[]): string[] {
  const orderMap = new Map(definitions.map((d) => [d.name, d.sort_order]));
  return [...names].sort((a, b) => {
    const oa = orderMap.has(a) ? orderMap.get(a)! : 9999;
    const ob = orderMap.has(b) ? orderMap.get(b)! : 9999;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });
}

type SlotWithHour = Pick<TimeSlot, 'name' | 'default_after_hour'>;

function hourForSlot(s: SlotWithHour): number {
  const h = s.default_after_hour;
  if (typeof h !== 'number' || Number.isNaN(h)) return 12;
  return Math.max(0, Math.min(23, h));
}

/**
 * Pick which tab should be selected from sessions the user can see (`allowedNames`),
 * using each session’s `default_after_hour` (local time). Same idea as the old
 * Morning/Lunch/Evening/Night hour bands: last session whose `default_after_hour` is <= current hour wins.
 */
export function pickDefaultSessionForHour(
  allSlots: SlotWithHour[],
  allowedNames: string[],
  hour: number = new Date().getHours()
): string {
  if (allowedNames.length === 0) return '';
  const allowed = new Set(allowedNames);
  const filtered = allSlots
    .filter((s) => allowed.has(s.name))
    .sort((a, b) => hourForSlot(a) - hourForSlot(b) || a.name.localeCompare(b.name));
  if (filtered.length === 0) return allowedNames[0];
  if (filtered.length === 1) return filtered[0].name;

  let chosen = filtered[0].name;
  for (const s of filtered) {
    if (hour >= hourForSlot(s)) chosen = s.name;
  }
  return chosen;
}

/** When only names are known (no DB yet), fall back to legacy four-slot bands by position. */
export function getDefaultTimeSlotFromOrder(orderedNames: string[]): string {
  if (orderedNames.length === 0) return '';
  const hour = new Date().getHours();
  if (orderedNames.length === 1) return orderedNames[0];
  if (orderedNames.length === 4) {
    if (hour < 12) return orderedNames[0];
    if (hour < 15) return orderedNames[1];
    if (hour < 19) return orderedNames[2];
    return orderedNames[3];
  }
  const n = orderedNames.length;
  const idx = Math.min(Math.floor((hour / 24) * n), n - 1);
  return orderedNames[idx];
}
