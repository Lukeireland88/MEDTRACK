/*
  # Medication display icon

  Optional medical-style icon key shown next to the medication name on the tracker.
  Allowed values match the app’s curated Lucide icon set (see medicationIcons.ts).
*/

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'pill';

COMMENT ON COLUMN medications.icon IS
  'Display icon key: pill, tablets, syringe, droplet, droplets, flask, inhaler, heart, thermometer';

ALTER TABLE medications
  DROP CONSTRAINT IF EXISTS medications_icon_check;

ALTER TABLE medications
  ADD CONSTRAINT medications_icon_check
  CHECK (
    icon IN (
      'pill',
      'tablets',
      'syringe',
      'droplet',
      'droplets',
      'flask',
      'inhaler',
      'heart',
      'thermometer'
    )
  );
