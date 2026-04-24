-- Henry conversations: one per user
CREATE TABLE public.henry_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- collected criteria
  relationship_goal TEXT,           -- 'plan_cul' | 'relation' | 'amitie' | 'discussion' | ...
  age_min INTEGER,
  age_max INTEGER,
  region TEXT,                      -- département / région slug
  tribes TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  -- step in the flow ('greeting' | 'goal' | 'age' | 'region' | 'tribes' | 'interests' | 'matching' | 'free')
  current_step TEXT NOT NULL DEFAULT 'greeting',
  -- billing counter: 1 credit deducted every 5 user messages
  pending_message_count INTEGER NOT NULL DEFAULT 0,
  total_messages_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.henry_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.henry_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'henry')),
  content TEXT NOT NULL,
  -- structured payload for quick replies, profiles, suggestions
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_henry_messages_conv ON public.henry_messages(conversation_id, created_at);
CREATE INDEX idx_henry_messages_user ON public.henry_messages(user_id);

-- RLS
ALTER TABLE public.henry_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.henry_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own henry conversation"
  ON public.henry_conversations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own henry conversation"
  ON public.henry_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own henry conversation"
  ON public.henry_conversations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own henry conversation"
  ON public.henry_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own henry messages"
  ON public.henry_messages FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own henry messages"
  ON public.henry_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own henry messages"
  ON public.henry_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger (reuse existing helper)
CREATE TRIGGER trg_henry_conversations_updated
  BEFORE UPDATE ON public.henry_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Get-or-create conversation for current user
CREATE OR REPLACE FUNCTION public.henry_get_or_create_conversation()
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

  SELECT * INTO v_conv FROM public.henry_conversations WHERE user_id = v_user;
  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;
  RETURN v_conv;
END;
$$;

-- Send a USER message: increments counter, deducts 1 credit every 5 messages
-- Returns: { success, message_id, credit_deducted, pending_count }
CREATE OR REPLACE FUNCTION public.henry_send_user_message(
  _content TEXT,
  _payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conv public.henry_conversations;
  v_msg_id UUID;
  v_new_pending INTEGER;
  v_credit_deducted BOOLEAN := false;
  v_deduct_result JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF _content IS NULL OR length(trim(_content)) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CONTENT';
  END IF;

  -- Get or create conversation
  SELECT * INTO v_conv FROM public.henry_conversations WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;

  v_new_pending := v_conv.pending_message_count + 1;

  -- Every 5 messages -> deduct 1 credit
  IF v_new_pending >= 5 THEN
    v_deduct_result := public.deduct_credits(
      v_user,
      1,
      'henry_message',
      'Conversation avec Henry (5 messages)'
    );

    IF NOT (v_deduct_result->>'success')::boolean THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INSUFFICIENT_CREDITS',
        'pending_count', v_conv.pending_message_count
      );
    END IF;
    v_credit_deducted := true;
    v_new_pending := 0;
  END IF;

  -- Insert message
  INSERT INTO public.henry_messages (conversation_id, user_id, role, content, payload)
  VALUES (v_conv.id, v_user, 'user', _content, _payload)
  RETURNING id INTO v_msg_id;

  -- Update counters
  UPDATE public.henry_conversations
  SET pending_message_count = v_new_pending,
      total_messages_sent = total_messages_sent + 1,
      updated_at = now()
  WHERE id = v_conv.id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_msg_id,
    'credit_deducted', v_credit_deducted,
    'pending_count', v_new_pending
  );
END;
$$;

-- Save a HENRY (bot) message — free
CREATE OR REPLACE FUNCTION public.henry_save_bot_message(
  _content TEXT,
  _payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conv public.henry_conversations;
  v_msg_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_conv FROM public.henry_conversations WHERE user_id = v_user;
  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;

  INSERT INTO public.henry_messages (conversation_id, user_id, role, content, payload)
  VALUES (v_conv.id, v_user, 'henry', _content, _payload)
  RETURNING id INTO v_msg_id;

  UPDATE public.henry_conversations
  SET updated_at = now()
  WHERE id = v_conv.id;

  RETURN v_msg_id;
END;
$$;

-- Update collected criteria + step
CREATE OR REPLACE FUNCTION public.henry_update_criteria(
  _relationship_goal TEXT DEFAULT NULL,
  _age_min INTEGER DEFAULT NULL,
  _age_max INTEGER DEFAULT NULL,
  _region TEXT DEFAULT NULL,
  _tribes TEXT[] DEFAULT NULL,
  _interests TEXT[] DEFAULT NULL,
  _current_step TEXT DEFAULT NULL
)
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

  SELECT * INTO v_conv FROM public.henry_conversations WHERE user_id = v_user;
  IF NOT FOUND THEN
    INSERT INTO public.henry_conversations (user_id) VALUES (v_user) RETURNING * INTO v_conv;
  END IF;

  UPDATE public.henry_conversations
  SET relationship_goal = COALESCE(_relationship_goal, relationship_goal),
      age_min            = COALESCE(_age_min, age_min),
      age_max            = COALESCE(_age_max, age_max),
      region             = COALESCE(_region, region),
      tribes             = COALESCE(_tribes, tribes),
      interests          = COALESCE(_interests, interests),
      current_step       = COALESCE(_current_step, current_step),
      updated_at         = now()
  WHERE id = v_conv.id
  RETURNING * INTO v_conv;

  RETURN v_conv;
END;
$$;

-- Reset conversation (clear messages + criteria)
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