/*
  # User settings

  Store handedness and background colour per signed-in user so appearance
  preferences follow the account across devices. Local cache remains for
  signed-out use and a faster first paint.
*/

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  handedness text NOT NULL DEFAULT 'left' CHECK (handedness IN ('left', 'right')),
  background_color text NOT NULL DEFAULT '#f1f5f9' CHECK (background_color ~* '^#[0-9a-f]{6}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_settings IS 'Per-account UI preferences (handedness, background colour).';

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_settings FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO authenticated;

DROP POLICY IF EXISTS "Users manage own user_settings" ON public.user_settings;
CREATE POLICY "Users manage own user_settings"
  ON user_settings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

  DELETE FROM public.user_settings WHERE user_id = uid;
  DELETE FROM public.symptom_events WHERE user_id = uid;
  DELETE FROM public.timeline_events WHERE user_id = uid;
  DELETE FROM public.medications WHERE user_id = uid;
  DELETE FROM public.time_slots WHERE user_id = uid;

  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
