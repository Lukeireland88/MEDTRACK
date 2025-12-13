/*
  # Add end date support for medications

  1. Changes
    - Add `end_date` column to `medications` table
      - Type: date (nullable)
      - Purpose: Track when a medication regimen should end
      - Medications past their end date will be hidden from the active list
  
  2. Notes
    - End date is optional (nullable) since not all medications have an end date
    - The application will filter out medications where current date > end_date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE medications ADD COLUMN end_date date;
  END IF;
END $$;