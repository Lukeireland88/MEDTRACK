/*
  # Create Medication History Log Table

  1. New Tables
    - `medication_logs`
      - `id` (uuid, primary key)
      - `medication_id` (uuid, foreign key to medications)
      - `time_slot_id` (uuid, foreign key to time_slots)
      - `dose_date` (date) - the date this log entry refers to
      - `action` (text) - "checked" or "unchecked"
      - `logged_at` (timestamptz) - when this action occurred
      
  2. Security
    - Enable RLS on medication_logs table
    - Add policies for public read and insert access

  3. Notes
    - This table tracks every time a medication checkbox is toggled
    - Each check/uncheck creates a new log entry with timestamp
    - Allows viewing complete history of when medications were marked taken/not taken
*/

CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  dose_date date NOT NULL,
  action text NOT NULL CHECK (action IN ('checked', 'unchecked')),
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to medication_logs"
  ON medication_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access to medication_logs"
  ON medication_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create an index for faster lookups by medication, slot, and date
CREATE INDEX IF NOT EXISTS idx_medication_logs_lookup 
  ON medication_logs(medication_id, time_slot_id, dose_date);