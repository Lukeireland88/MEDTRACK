/*
  # Optional dose safety limits per medication

  - max_doses_24h: optional ceiling over a rolling 24 hours (soft warning on log)
  - min_interval_minutes: optional minimum gap between doses (soft warning on log)
*/

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS max_doses_24h int
  CHECK (max_doses_24h IS NULL OR max_doses_24h > 0);

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS min_interval_minutes int
  CHECK (min_interval_minutes IS NULL OR min_interval_minutes > 0);

COMMENT ON COLUMN medications.max_doses_24h IS
  'Optional max taken doses in a rolling 24h window; UI warns but can continue';

COMMENT ON COLUMN medications.min_interval_minutes IS
  'Optional minimum minutes between doses; UI warns but can continue';
