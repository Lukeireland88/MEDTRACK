-- Allow removing "marked taken" log rows when user unchecks (no separate "unchecked" audit row).
CREATE POLICY "Public delete access to medication_logs"
  ON medication_logs
  FOR DELETE
  TO public
  USING (true);
