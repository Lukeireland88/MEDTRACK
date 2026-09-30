/*
  # Keep self-deletion, stop exposing a SECURITY DEFINER RPC

  Signed-in users must be able to delete their own account, and removing
  auth.users requires owner privileges. That privileged body does not belong
  in an API-exposed schema: PostgREST would publish it at
  /rest/v1/rpc/delete_own_account.

  private.delete_own_account is SECURITY DEFINER and is not in the exposed
  API schemas. public.delete_own_account is SECURITY INVOKER, takes no
  arguments, and only forwards the call. It still deletes solely the row for
  auth.uid().
*/

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

REVOKE ALL ON FUNCTION private.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.delete_own_account() TO authenticated;

COMMENT ON FUNCTION private.delete_own_account() IS
  'Deletes the signed-in user and their rows. SECURITY DEFINER so it can remove auth.users. Not in an exposed API schema.';

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.delete_own_account();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

COMMENT ON FUNCTION public.delete_own_account() IS
  'Caller-scoped account deletion. Runs as the signed-in user and forwards to private.delete_own_account().';
