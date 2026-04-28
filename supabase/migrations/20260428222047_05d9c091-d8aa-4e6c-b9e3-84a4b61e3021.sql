-- Persist Henry shown profiles to never re-propose them until reset
ALTER TABLE public.henry_conversations
  ADD COLUMN IF NOT EXISTS shown_profile_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- Append profile ids to the shown list (dedup)
CREATE OR REPLACE FUNCTION public.henry_add_shown_profiles(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  UPDATE public.henry_conversations
  SET shown_profile_ids = (
    SELECT COALESCE(array_agg(DISTINCT x), '{}'::uuid[])
    FROM unnest(coalesce(shown_profile_ids, '{}'::uuid[]) || coalesce(_ids, '{}'::uuid[])) AS x
    WHERE x IS NOT NULL
  ),
  updated_at = now()
  WHERE user_id = _uid;
END;
$$;

-- Clear the shown profile list (when user resets / refines criteria)
CREATE OR REPLACE FUNCTION public.henry_clear_shown_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  UPDATE public.henry_conversations
  SET shown_profile_ids = '{}'::uuid[],
      updated_at = now()
  WHERE user_id = _uid;
END;
$$;

-- Ensure the existing reset function also wipes shown_profile_ids
CREATE OR REPLACE FUNCTION public.henry_reset_conversation()
RETURNS public.henry_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _conv public.henry_conversations;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  DELETE FROM public.henry_messages WHERE user_id = _uid;

  UPDATE public.henry_conversations
  SET relationship_goal = NULL,
      age_min = NULL,
      age_max = NULL,
      region = NULL,
      tribes = '{}'::text[],
      interests = '{}'::text[],
      height_min = NULL,
      height_max = NULL,
      languages = '{}'::text[],
      availability = '{}'::text[],
      free_notes = '{}'::jsonb,
      current_step = 'goal',
      pending_message_count = 0,
      total_messages_sent = 0,
      setup_completed = false,
      rejected_reasons = '{}'::jsonb,
      shown_profile_ids = '{}'::uuid[],
      updated_at = now()
  WHERE user_id = _uid
  RETURNING * INTO _conv;

  RETURN _conv;
END;
$$;