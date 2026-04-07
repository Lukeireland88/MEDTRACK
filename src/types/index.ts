export interface TimeSlot {
  id: string;
  name: string;
  sort_order: number;
}

export type DosingMode = 'time_slots' | 'flexible_daily';

export interface Medication {
  id: string;
  name: string;
  when_text: string;
  schedule_type: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  days_of_week: number[] | null;
  start_date: string | null;
  interval_days: number | null;
  notes: string | null;
  end_date: string | null;
  /** Inclusive local-date window (YYYY-MM-DD) during which med is paused */
  pause_start_date: string | null;
  /** Inclusive local-date window (YYYY-MM-DD) during which med is paused */
  pause_end_date: string | null;
  active: boolean;
  dosing_mode: DosingMode;
  target_doses_per_day: number | null;
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

export interface MedicationDoseEvent {
  id: string;
  medication_id: string;
  dose_date: string;
  taken_at: string;
  amount: number;
}

export interface DoseTaken {
  id: string;
  medication_id: string;
  time_slot_id: string;
  dose_date: string;
  taken: boolean;
  taken_at: string;
  /** Set when `taken` is false (explicit not taken) */
  not_taken_reason?: string | null;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  time_slot_id: string;
  dose_date: string;
  action: 'checked' | 'unchecked';
  logged_at: string;
  reason?: string | null;
}

/** Per med for the active time slot + selected date (from `doses_taken`). */
export interface SlotDoseState {
  taken: boolean;
  notTakenReason: string | null;
}

/** One historical course window for a medication (rescue / repeat courses). */
export interface MedicationCoursePeriod {
  id: string;
  medication_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at?: string;
}

export type TimelineEventType = 'note' | 'measurement' | 'visit';

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType | string;
  measurement_type?: string | null;
  occurred_at: string;
  event_date: string;
  title: string;
  value_text: string | null;
  notes: string | null;
  created_at?: string;
}

export type SymptomEventType = 'seizure';

export interface SymptomEvent {
  id: string;
  event_type: SymptomEventType;
  occurred_at: string;
  event_date: string;
  duration_seconds: number;
  notes: string | null;
}
