/*
  # Medication display order

  Adds per-user `sort_order` so the tracker table can be manually reordered.
  Existing rows are backfilled alphabetically within each user.
*/

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS sort_order integer;

-- Backfill: alphabetical within each user (stable starting order)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY lower(name), created_at, id
    ) AS rn
  FROM medications
  WHERE sort_order IS NULL
)
UPDATE medications m
SET sort_order = ranked.rn
FROM ranked
WHERE m.id = ranked.id;

ALTER TABLE medications
  ALTER COLUMN sort_order SET DEFAULT 0;

UPDATE medications SET sort_order = 0 WHERE sort_order IS NULL;

ALTER TABLE medications
  ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS medications_user_id_sort_order_idx
  ON medications (user_id, sort_order);
