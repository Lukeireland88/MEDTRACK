/*
  Flexible daily dosing: medications taken multiple times per day at variable times.
  - medications.dosing_mode: time_slots (default) vs flexible_daily
  - medications.target_doses_per_day: optional goal (e.g. 4); NULL = track count only
  - medication_dose_events: one row per logged dose with timestamp
*/

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS dosing_mode text NOT NULL DEFAULT 'time_slots'
  CHECK (dosing_mode IN ('time_slots', 'flexible_daily'));

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS target_doses_per_day int
  CHECK (target_doses_per_day IS NULL OR target_doses_per_day > 0);

CREATE TABLE IF NOT EXISTS medication_dose_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  dose_date date NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_medication_dose_events_med_date
  ON medication_dose_events(medication_id, dose_date);

ALTER TABLE medication_dose_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medication_dose_events"
  ON medication_dose_events FOR SELECT TO public USING (true);

CREATE POLICY "Public insert access to medication_dose_events"
  ON medication_dose_events FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public delete access to medication_dose_events"
  ON medication_dose_events FOR DELETE TO public USING (true);
