/*
  # Seed Medications Data

  1. Inserts all medications with their schedules
    - Morning medications (12 items)
    - Lunch medications (3 items)
    - Evening medications (none)
    - Night medications (5 items)
  
  2. Links medications to time slots via medication_slots
  
  3. Special schedules:
    - Ferrous Fumarate: every 2 days starting 2025-09-18
    - Azithromycin: Monday, Wednesday, Friday (days 1, 3, 5)
    - All others: daily
*/

-- Clear existing data (in case of re-running)
DELETE FROM medication_slots;
DELETE FROM medications;

-- Insert Morning medications
INSERT INTO medications (name, when_text, schedule_type, days_of_week, start_date, interval_days) VALUES
  ('Isosorbide (Half Tablet)', 'Daily', 'daily', NULL, NULL, NULL),
  ('Clopidogrel', 'Daily', 'daily', NULL, NULL, NULL),
  ('Indapamide', 'Daily', 'daily', NULL, NULL, NULL),
  ('Lansoprazole', 'Daily', 'daily', NULL, NULL, NULL),
  ('Levetiracetam (1000 mg)', 'Daily', 'daily', NULL, NULL, NULL),
  ('Rivaroxaban', 'Daily', 'daily', NULL, NULL, NULL),
  ('Trimbow inhaler (Red)', 'Daily', 'daily', NULL, NULL, NULL),
  ('Diltiazem', 'Daily', 'daily', NULL, NULL, NULL),
  ('Phenoxymethylpenicillin', 'Daily', 'daily', NULL, NULL, NULL),
  ('Carbocisteine', 'Daily', 'daily', NULL, NULL, NULL),
  ('Bumetanide', 'Daily', 'daily', NULL, NULL, NULL),
  ('Azithromycin', 'Monday, Wednesday, Friday', 'days_of_week', ARRAY[1, 3, 5], NULL, NULL);

-- Insert Lunch medications
INSERT INTO medications (name, when_text, schedule_type, days_of_week, start_date, interval_days) VALUES
  ('Levetiracetam (500 mg)', 'Daily @ 2PM', 'daily', NULL, NULL, NULL);

-- Insert Night medications
INSERT INTO medications (name, when_text, schedule_type, days_of_week, start_date, interval_days) VALUES
  ('Sodium Picosulfate 5ml', 'Daily', 'daily', NULL, NULL, NULL);

-- Link medications to Morning time slot
INSERT INTO medication_slots (medication_id, time_slot_id)
SELECT m.id, ts.id
FROM medications m
CROSS JOIN time_slots ts
WHERE ts.name = 'Morning'
AND m.name IN (
  'Isosorbide (Half Tablet)',
  'Clopidogrel',
  'Indapamide',
  'Lansoprazole',
  'Levetiracetam (1000 mg)',
  'Rivaroxaban',
  'Trimbow inhaler (Red)',
  'Diltiazem',
  'Phenoxymethylpenicillin',
  'Carbocisteine',
  'Bumetanide',
  'Azithromycin'
);

-- Link medications to Lunch time slot
INSERT INTO medication_slots (medication_id, time_slot_id)
SELECT m.id, ts.id
FROM medications m
CROSS JOIN time_slots ts
WHERE ts.name = 'Lunch'
AND m.name IN (
  'Levetiracetam (500 mg)',
  'Bumetanide',
  'Carbocisteine'
);

-- Link medications to Night time slot
INSERT INTO medication_slots (medication_id, time_slot_id)
SELECT m.id, ts.id
FROM medications m
CROSS JOIN time_slots ts
WHERE ts.name = 'Night'
AND m.name IN (
  'Sodium Picosulfate 5ml',
  'Carbocisteine',
  'Diltiazem',
  'Phenoxymethylpenicillin',
  'Trimbow inhaler (Red)'
);