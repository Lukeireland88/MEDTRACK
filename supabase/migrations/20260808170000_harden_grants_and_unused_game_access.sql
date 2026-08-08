/*
  # Harden grants and unused game access

  1. Medical tables: revoke anon; authenticated DML only (no TRUNCATE)
  2. Unused game tables: drop public SELECT policies and revoke API grants
  3. Revoke EXECUTE on trigger/helper functions from anon/authenticated
  4. Fix generate_room_code mutable search_path
*/

-- ---------------------------------------------------------------------------
-- Medical tables: revoke anon entirely; authenticated gets DML only (no TRUNCATE)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
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
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated, PUBLIC', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Unused game tables (not used by Medtrack): no public API access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS games_select ON public.games;
DROP POLICY IF EXISTS game_sessions_select ON public.game_sessions;
DROP POLICY IF EXISTS game_actions_select ON public.game_actions;

REVOKE ALL ON TABLE public.games FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.game_sessions FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.game_actions FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------------
-- Trigger helper must not be callable via PostgREST RPC
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.handle_new_user_time_slots() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.handle_new_user_time_slots() SET search_path = public;

-- ---------------------------------------------------------------------------
-- Unused helper: fix mutable search_path and revoke public execute
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_room_code() FROM PUBLIC, anon, authenticated;
