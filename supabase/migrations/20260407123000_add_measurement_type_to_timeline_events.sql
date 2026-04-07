/*
  # Add measurement_type to timeline_events

  Lets us keep common metrics consistent (SpO2, pulse, BP, temp, etc).
*/

ALTER TABLE timeline_events
ADD COLUMN IF NOT EXISTS measurement_type text;

CREATE INDEX IF NOT EXISTS timeline_events_measurement_type_idx
  ON timeline_events(measurement_type);

