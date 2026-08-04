/*
  # Per-user ownership and RLS

  1. Add user_id to root tables (medications, time_slots, symptom_events, timeline_events)
  2. Backfill existing rows to the first auth user
  3. Per-user unique session names
  4. Seed default time slots for new users
  5. Replace open public policies with owner-scoped authenticated policies
*/

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE symptom_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill existing data to the sole / first auth user
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found to own existing medication data';
  END IF;

  UPDATE medications SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE time_slots SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE symptom_events SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE timeline_events SET user_id = owner_id WHERE user_id IS NULL;
END $$;

ALTER TABLE medications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE time_slots ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE symptom_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE timeline_events ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE medications ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE time_slots ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE symptom_events ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE timeline_events ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS medications_user_id_idx ON medications(user_id);
CREATE INDEX IF NOT EXISTS time_slots_user_id_idx ON time_slots(user_id);
CREATE INDEX IF NOT EXISTS symptom_events_user_id_idx ON symptom_events(user_id);
CREATE INDEX IF NOT EXISTS timeline_events_user_id_idx ON timeline_events(user_id);

-- Per-user session names (drop global unique on name)
ALTER TABLE time_slots DROP CONSTRAINT IF EXISTS time_slots_name_key;
ALTER TABLE time_slots DROP CONSTRAINT IF EXISTS time_slots_user_id_name_key;
ALTER TABLE time_slots ADD CONSTRAINT time_slots_user_id_name_key UNIQUE (user_id, name);

-- ---------------------------------------------------------------------------
-- Seed default sessions for newly registered users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_time_slots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.time_slots (name, sort_order, default_after_hour, user_id) VALUES
    ('Morning', 1, 0, NEW.id),
    ('Lunch', 2, 12, NEW.id),
    ('Evening', 3, 15, NEW.id),
    ('Night', 4, 19, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_time_slots ON auth.users;
CREATE TRIGGER on_auth_user_created_time_slots
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_time_slots();

-- ---------------------------------------------------------------------------
-- Drop all existing policies on medication-domain tables
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'medications',
        'time_slots',
        'medication_slots',
        'doses_taken',
        'medication_logs',
        'medication_dose_events',
        'symptom_events',
        'timeline_events',
        'medication_course_periods',
        'medication_pause_periods'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- New owner-scoped policies (authenticated only)
-- ---------------------------------------------------------------------------

-- medications
CREATE POLICY "Users manage own medications"
  ON medications FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- time_slots
CREATE POLICY "Users manage own time_slots"
  ON time_slots FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- symptom_events
CREATE POLICY "Users manage own symptom_events"
  ON symptom_events FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- timeline_events
CREATE POLICY "Users manage own timeline_events"
  ON timeline_events FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- medication_slots (via medication ownership)
CREATE POLICY "Users manage own medication_slots"
  ON medication_slots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_slots.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_slots.medication_id AND m.user_id = auth.uid()
    )
  );

-- doses_taken
CREATE POLICY "Users manage own doses_taken"
  ON doses_taken FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = doses_taken.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = doses_taken.medication_id AND m.user_id = auth.uid()
    )
  );

-- medication_logs
CREATE POLICY "Users manage own medication_logs"
  ON medication_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_logs.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_logs.medication_id AND m.user_id = auth.uid()
    )
  );

-- medication_dose_events
CREATE POLICY "Users manage own medication_dose_events"
  ON medication_dose_events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_dose_events.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_dose_events.medication_id AND m.user_id = auth.uid()
    )
  );

-- medication_course_periods
CREATE POLICY "Users manage own medication_course_periods"
  ON medication_course_periods FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_course_periods.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_course_periods.medication_id AND m.user_id = auth.uid()
    )
  );

-- medication_pause_periods
CREATE POLICY "Users manage own medication_pause_periods"
  ON medication_pause_periods FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_pause_periods.medication_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_pause_periods.medication_id AND m.user_id = auth.uid()
    )
  );
