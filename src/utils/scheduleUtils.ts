import { toLocalDateKey, toLocalDateOnly } from './dateUtils';

export interface Medication {
  id: string;
  name: string;
  when_text: string;
  schedule_type: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  days_of_week: number[] | null;
  start_date: string | null;
  interval_days: number | null;
  pause_start_date?: string | null;
  pause_end_date?: string | null;
  active: boolean;
  dosing_mode?: 'time_slots' | 'flexible_daily';
  target_doses_per_day?: number | null;
}

export function isPaused(med: Pick<Medication, 'pause_start_date' | 'pause_end_date'>, date: Date): boolean {
  const start = med.pause_start_date ?? null;
  const end = med.pause_end_date ?? null;
  if (!start && !end) return false;

  const localDate = toLocalDateKey(date);
  const startDay = (start ?? '0000-01-01');
  const endDay = (end ?? '9999-12-31');
  return localDate >= startDay && localDate <= endDay;
}

export function isDue(med: Medication, date: Date): boolean {
  const localDate = toLocalDateOnly(date);
  if (isPaused(med, localDate)) return false;

  switch (med.schedule_type) {
    case 'daily':
      return true;

    case 'days_of_week':
      if (!med.days_of_week || med.days_of_week.length === 0) return false;
      const dayOfWeek = localDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return med.days_of_week.includes(adjustedDay);

    case 'every_n_days_from_start':
      if (!med.start_date || !med.interval_days) return false;
      const startDate = toLocalDateOnly(new Date(med.start_date));
      if (localDate < startDate) return false;
      const diffDays = Math.floor((localDate.getTime() - startDate.getTime()) / 86400000);
      return diffDays % med.interval_days === 0;

    default:
      return false;
  }
}

export function nextDueDate(med: Medication, fromDate: Date): Date {
  const startCheck = toLocalDateOnly(fromDate);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(startCheck);
    checkDate.setDate(startCheck.getDate() + i);
    if (isDue(med, checkDate)) {
      return checkDate;
    }
  }

  return startCheck;
}
