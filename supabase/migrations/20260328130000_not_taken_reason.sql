-- Optional reason when a dose is explicitly marked not taken (time-slot meds).
ALTER TABLE doses_taken
  ADD COLUMN IF NOT EXISTS not_taken_reason text;

ALTER TABLE medication_logs
  ADD COLUMN IF NOT EXISTS reason text;
