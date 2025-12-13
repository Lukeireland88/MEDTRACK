/*
  # Add Write Policies for Medication Management

  1. Changes
    - Add INSERT policy for medications table
    - Add UPDATE policy for medications table
    - Add DELETE policy for medications table (for future use)
    - Add INSERT policy for medication_slots table
    - Add DELETE policy for medication_slots table

  2. Security
    - Allows public write access for now
    - Can be restricted to authenticated users later if auth is added
*/

-- Add write policies for medications table
CREATE POLICY "Public insert access to medications"
  ON medications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to medications"
  ON medications
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to medications"
  ON medications
  FOR DELETE
  TO public
  USING (true);

-- Add write policies for medication_slots table
CREATE POLICY "Public insert access to medication_slots"
  ON medication_slots
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public delete access to medication_slots"
  ON medication_slots
  FOR DELETE
  TO public
  USING (true);