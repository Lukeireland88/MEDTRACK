export function toLocalDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDateLine(date: Date): { weekday: string; fullDate: string } {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const fullDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  return { weekday, fullDate };
}

export function getDefaultTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 15) return 'Lunch';
  if (hour < 19) return 'Evening';
  return 'Night';
}
