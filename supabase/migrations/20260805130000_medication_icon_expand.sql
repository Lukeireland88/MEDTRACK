/*
  # Expand medication icon allow-list

  Adds form icons matching common medication types (capsule, dropper, bottle,
  inhaler art, cream tube, nasal spray, liquid+spoon).
*/

ALTER TABLE medications
  DROP CONSTRAINT IF EXISTS medications_icon_check;

ALTER TABLE medications
  ADD CONSTRAINT medications_icon_check
  CHECK (
    icon IN (
      'pill',
      'tablets',
      'capsule',
      'syringe',
      'droplet',
      'droplets',
      'dropper',
      'liquid_spoon',
      'bottle',
      'flask',
      'inhaler',
      'cream',
      'nasal_spray',
      'heart',
      'thermometer'
    )
  );

COMMENT ON COLUMN medications.icon IS
  'Display icon key (see src/utils/medicationIcons.ts)';
