/*
  # Medication Tracker Schema

  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Morning, Lunch, Evening, Night
      - `sort_order` (int) - for ordering display
    
    - `medications`
      - `id` (uuid, primary key)
      - `name` (text, required) - medication name
      - `when_text` (text, required) - display text like "Daily", "Monday, Wednesday, Friday"
      - `schedule_type` (text, required) - "daily", "days_of_week", "every_n_days_from_start"
      - `days_of_week` (int[], nullable) - for days_of_week schedule (1=Mon..7=Sun)
      - `start_date` (date, nullable) - for every_n_days_from_start schedule
      - `interval_days` (int, nullable) - for every_n_days_from_start schedule
      - `active` (boolean, default true)
    
    - `medication_slots` (join table)
      - `id` (uuid, primary key)
      - `medication_id` (uuid, foreign key)
      - `time_slot_id` (uuid, foreign key)
      - unique constraint on (medication_id, time_slot_id)
    
    - `doses_taken` (tracks which doses have been taken)
      - `id` (uuid, primary key)
      - `medication_id` (uuid, foreign key)
      - `time_slot_id` (uuid, foreign key)
      - `dose_date` (date, required)
      - `taken` (boolean, default true)
      - `taken_at` (timestamptz, default now())
      - unique constraint on (medication_id, time_slot_id, dose_date)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (auth can be added later)
*/

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  sort_order int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to time_slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (true);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  when_text text NOT NULL,
  schedule_type text NOT NULL CHECK (schedule_type IN ('daily', 'days_of_week', 'every_n_days_from_start')),
  days_of_week int[],
  start_date date,
  interval_days int,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medications"
  ON medications
  FOR SELECT
  TO public
  USING (active = true);

-- Create medication_slots join table
CREATE TABLE IF NOT EXISTS medication_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(medication_id, time_slot_id)
);

ALTER TABLE medication_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medication_slots"
  ON medication_slots
  FOR SELECT
  TO public
  USING (true);

-- Create doses_taken table
CREATE TABLE IF NOT EXISTS doses_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  dose_date date NOT NULL,
  taken boolean DEFAULT true,
  taken_at timestamptz DEFAULT now(),
  UNIQUE(medication_id, time_slot_id, dose_date)
);

ALTER TABLE doses_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to doses_taken"
  ON doses_taken
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to doses_taken"
  ON doses_taken
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to doses_taken"
  ON doses_taken
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to doses_taken"
  ON doses_taken
  FOR DELETE
  TO public
  USING (true);

-- Insert time slots
INSERT INTO time_slots (name, sort_order) VALUES
  ('Morning', 1),
  ('Lunch', 2),
  ('Evening', 3),
  ('Night', 4)
ON CONFLICT (name) DO NOTHING;