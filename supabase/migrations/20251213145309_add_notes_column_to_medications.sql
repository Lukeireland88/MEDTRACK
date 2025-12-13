/*
  # Add Notes Column to Medications

  1. Changes
    - Add `notes` column to medications table (text, nullable)
    - This allows storing optional notes/instructions for each medication

  2. Notes
    - Using ALTER TABLE to add column safely with IF NOT EXISTS check
    - Column is nullable since notes are optional
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'notes'
  ) THEN
    ALTER TABLE medications ADD COLUMN notes text;
  END IF;
END $$;