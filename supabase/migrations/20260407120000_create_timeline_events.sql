/*
  # Timeline events (timestamped notes / measurements)

  Stores free-form, backdateable timestamped events like:
  - doctor visits
  - oxygen saturation values
  - general notes
*/

CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  event_date date NOT NULL,
  title text NOT NULL,
  value_text text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_events_event_date_idx
  ON timeline_events(event_date);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to timeline_events"
  ON timeline_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to timeline_events"
  ON timeline_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to timeline_events"
  ON timeline_events
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to timeline_events"
  ON timeline_events
  FOR DELETE
  TO public
  USING (true);

