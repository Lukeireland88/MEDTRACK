/*
  # Medication pause periods (pause log)

  Tracks historical pause windows for meds that are temporarily paused and later resumed.
*/

CREATE TABLE IF NOT EXISTS medication_pause_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  pause_start_date date NOT NULL,
  pause_end_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medication_pause_periods_medication_id_idx
  ON medication_pause_periods(medication_id);

ALTER TABLE medication_pause_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medication_pause_periods"
  ON medication_pause_periods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to medication_pause_periods"
  ON medication_pause_periods
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to medication_pause_periods"
  ON medication_pause_periods
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to medication_pause_periods"
  ON medication_pause_periods
  FOR DELETE
  TO public
  USING (true);

