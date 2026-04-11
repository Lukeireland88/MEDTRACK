/*
  # Time slots — write access

  Allows inserts/updates/deletes on `time_slots` (same public access model as medications).
*/

CREATE POLICY "Public insert access to time_slots"
  ON time_slots
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update access to time_slots"
  ON time_slots
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access to time_slots"
  ON time_slots
  FOR DELETE
  TO public
  USING (true);
