export interface TimeSlot {
  id: string;
  name: string;
  sort_order: number;
}

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

export interface MedicationSlot {
  id: string;
  medication_id: string;
  time_slot_id: string;
}

export interface MedicationWithSlots extends Medication {
  time_slot_names: string[];
  is_multiple: boolean;
}

export interface DoseTaken {
  id: string;
  medication_id: string;
  time_slot_id: string;
  dose_date: string;
  taken: boolean;
  taken_at: string;
}
