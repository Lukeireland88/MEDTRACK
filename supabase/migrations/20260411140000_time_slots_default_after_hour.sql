/*
  # Time slots — default hour for auto-selecting the active tab

  `default_after_hour` (0–23, local time): the session is the default tab when the
  current hour is >= this value and >= all earlier sessions’ values in the same list
  (same logic as the original Morning/Lunch/Evening/Night bands).

  Seed legacy names to match previous behavior: Morning 0, Lunch 12, Evening 15, Night 19.
*/

ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS default_after_hour smallint NOT NULL DEFAULT 12;

COMMENT ON COLUMN time_slots.default_after_hour IS 'Local hour (0–23) when this session becomes the default tab for the day (see pickDefaultSessionForHour).';

UPDATE time_slots SET default_after_hour = 0 WHERE name = 'Morning';
UPDATE time_slots SET default_after_hour = 12 WHERE name = 'Lunch';
UPDATE time_slots SET default_after_hour = 15 WHERE name = 'Evening';
UPDATE time_slots SET default_after_hour = 19 WHERE name = 'Night';
