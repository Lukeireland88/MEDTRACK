/*
  # Medication course periods (start/end log)

  Tracks historical start/end windows for meds that stop and restart (e.g. rescue meds, antibiotic courses).
*/

CREATE TABLE IF NOT EXISTS medication_course_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medication_course_periods_medication_id_idx
  ON medication_course_periods(medication_id);

ALTER TABLE medication_course_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medication_course_periods"
  ON medication_course_periods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to medication_course_periods"
  ON medication_course_periods
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to medication_course_periods"
  ON medication_course_periods
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to medication_course_periods"
  ON medication_course_periods
  FOR DELETE
  TO public
  USING (true);
