-- Henry : passe au modèle "0.2 crédit débité instantanément par message utilisateur"
-- (au lieu de 1 crédit tous les 5 messages)

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
  v_deduct_result JSONB;
  v_cost NUMERIC := 0.2; -- coût par message Henry
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

  -- Débit instantané de 0.2 crédit
  v_deduct_result := public.deduct_credits(
    v_user,
    v_cost,
    'henry_message',
    'Message envoyé à Henry'
  );

  IF NOT (v_deduct_result->>'success')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'pending_count', 0
    );
  END IF;

  -- Insert message
  INSERT INTO public.henry_messages (conversation_id, user_id, role, content, payload)
  VALUES (v_conv.id, v_user, 'user', _content, _payload)
  RETURNING id INTO v_msg_id;

  -- Update counters (pending_message_count gardé à 0, total incrémenté)
  UPDATE public.henry_conversations
  SET pending_message_count = 0,
      total_messages_sent = total_messages_sent + 1,
      updated_at = now()
  WHERE id = v_conv.id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_msg_id,
    'credit_deducted', true,
    'credit_amount', v_cost,
    'pending_count', 0
  );
END;
$$;