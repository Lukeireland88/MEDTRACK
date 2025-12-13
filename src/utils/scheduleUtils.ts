import { toLocalDateOnly } from './dateUtils';

export interface Medication {
  id: string;
  name: string;
  when_text: string;
  schedule_type: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  days_of_week: number[] | null;
  start_date: string | null;
  interval_days: number | null;
  active: boolean;
}

export function isDue(med: Medication, date: Date): boolean {
  const localDate = toLocalDateOnly(date);

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
