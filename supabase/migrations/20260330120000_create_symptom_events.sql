/*
  # Symptom events (seizure log)

  Stores caregiver-entered symptom events such as seizures.

  Fields:
  - event_type: currently 'seizure' (extensible)
  - occurred_at: timestamp (when it happened)
  - event_date: local date (YYYY-MM-DD) used for range filtering
  - duration_seconds: integer duration
  - notes: optional free text
*/

CREATE TABLE IF NOT EXISTS symptom_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('seizure')),
  occurred_at timestamptz NOT NULL,
  event_date date NOT NULL,
  duration_seconds int NOT NULL CHECK (duration_seconds >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to symptom_events"
  ON symptom_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to symptom_events"
  ON symptom_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public delete access to symptom_events"
  ON symptom_events
  FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_symptom_events_date
  ON symptom_events(event_date);
