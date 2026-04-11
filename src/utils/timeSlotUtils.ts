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

/** Pick a reasonable default tab from ordered session names (by time of day when there are four; otherwise by index). */
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
