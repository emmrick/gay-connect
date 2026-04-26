-- Enrich henry_conversations with free-text notes + new criteria
ALTER TABLE public.henry_conversations
  ADD COLUMN IF NOT EXISTS free_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS height_min INTEGER,
  ADD COLUMN IF NOT EXISTS height_max INTEGER,
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability TEXT[] NOT NULL DEFAULT '{}';

-- Update criteria function to accept the new fields
CREATE OR REPLACE FUNCTION public.henry_update_criteria(
  _relationship_goal TEXT DEFAULT NULL,
  _age_min INTEGER DEFAULT NULL,
  _age_max INTEGER DEFAULT NULL,
  _region TEXT DEFAULT NULL,
  _tribes TEXT[] DEFAULT NULL,
  _interests TEXT[] DEFAULT NULL,
  _current_step TEXT DEFAULT NULL,
  _height_min INTEGER DEFAULT NULL,
  _height_max INTEGER DEFAULT NULL,
  _languages TEXT[] DEFAULT NULL,
  _availability TEXT[] DEFAULT NULL,
  _free_note_step TEXT DEFAULT NULL,
  _free_note_text TEXT DEFAULT NULL
)
RETURNS public.henry_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conv public.henry_conversations;
  v_notes JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_conv FROM public.henry_conversations WHERE user_id = v_user;
  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;

  v_notes := COALESCE(v_conv.free_notes, '{}'::jsonb);
  IF _free_note_step IS NOT NULL AND _free_note_text IS NOT NULL THEN
    v_notes := v_notes || jsonb_build_object(_free_note_step, _free_note_text);
  END IF;

  UPDATE public.henry_conversations
  SET relationship_goal = COALESCE(_relationship_goal, relationship_goal),
      age_min            = COALESCE(_age_min, age_min),
      age_max             = COALESCE(_age_max, age_max),
      region             = COALESCE(_region, region),
      tribes             = COALESCE(_tribes, tribes),
      interests          = COALESCE(_interests, interests),
      current_step       = COALESCE(_current_step, current_step),
      height_min         = COALESCE(_height_min, height_min),
      height_max         = COALESCE(_height_max, height_max),
      languages          = COALESCE(_languages, languages),
      availability       = COALESCE(_availability, availability),
      free_notes         = v_notes,
      updated_at         = now()
  WHERE id = v_conv.id
  RETURNING * INTO v_conv;

  RETURN v_conv;
END;
$$;

-- Reset also clears the new fields
CREATE OR REPLACE FUNCTION public.henry_reset_conversation()
RETURNS public.henry_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conv public.henry_conversations;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  DELETE FROM public.henry_messages WHERE user_id = v_user;

  UPDATE public.henry_conversations
  SET relationship_goal = NULL,
      age_min = NULL,
      age_max = NULL,
      region = NULL,
      tribes = '{}',
      interests = '{}',
      height_min = NULL,
      height_max = NULL,
      languages = '{}',
      availability = '{}',
      free_notes = '{}'::jsonb,
      current_step = 'greeting',
      pending_message_count = 0,
      updated_at = now()
  WHERE user_id = v_user
  RETURNING * INTO v_conv;

  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;

  RETURN v_conv;
END;
$$;