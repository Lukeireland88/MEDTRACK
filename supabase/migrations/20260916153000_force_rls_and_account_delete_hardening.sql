/*
  Launch hardening: force RLS, keep owner-only policies, and delete owned rows
  before removing the Auth user. Non-destructive: no drops of user data.
*/

-- ---------------------------------------------------------------------------
-- Force RLS so table owners cannot accidentally bypass policies via the API
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, PUBLIC', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
  END LOOP;
END $$;

-- Unused leftover tables (not used by My Meds Record): keep API-inaccessible
DO $$
BEGIN
  IF to_regclass('public.games') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.games ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.games FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.games FROM anon, authenticated, PUBLIC';
  END IF;
  IF to_regclass('public.game_sessions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.game_sessions FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.game_sessions FROM anon, authenticated, PUBLIC';
  END IF;
  IF to_regclass('public.game_actions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.game_actions FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.game_actions FROM anon, authenticated, PUBLIC';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Child medication tables cascade from medications / time_slots.
  DELETE FROM public.symptom_events WHERE user_id = uid;
  DELETE FROM public.timeline_events WHERE user_id = uid;
  DELETE FROM public.medications WHERE user_id = uid;
  DELETE FROM public.time_slots WHERE user_id = uid;

  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
