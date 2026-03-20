
-- Polls system for group chats
CREATE TABLE public.poll_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.poll_messages(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.poll_messages(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Credit gifts system
CREATE TABLE public.credit_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 1 AND amount <= 5),
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.poll_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_gifts ENABLE ROW LEVEL SECURITY;

-- Poll messages: authenticated can read, creator can insert
CREATE POLICY "Authenticated can read polls" ON public.poll_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creator can insert polls" ON public.poll_messages FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creator can update polls" ON public.poll_messages FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Poll options: authenticated can read, poll creator can insert
CREATE POLICY "Authenticated can read options" ON public.poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Poll creator can insert options" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.poll_messages WHERE id = poll_id AND created_by = auth.uid())
);

-- Poll votes: authenticated can read, user can insert/delete own
CREATE POLICY "Authenticated can read votes" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "User can vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "User can remove vote" ON public.poll_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Credit gifts: participants can read, sender can insert
CREATE POLICY "Participants can read gifts" ON public.credit_gifts FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Sender can insert gifts" ON public.credit_gifts FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_gifts;

-- Anti-spam function for gifts
CREATE OR REPLACE FUNCTION public.send_credit_gift(_sender_id UUID, _recipient_id UUID, _amount NUMERIC, _message_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _gifts_today INT;
  _gift_id UUID;
BEGIN
  -- Validate amount
  IF _amount < 1 OR _amount > 5 THEN
    RETURN json_build_object('success', false, 'error', 'Le montant doit être entre 1 et 5 crédits');
  END IF;

  -- Anti-spam: max 10 gifts per day
  SELECT COUNT(*) INTO _gifts_today
  FROM public.credit_gifts
  WHERE sender_id = _sender_id
    AND created_at > now() - interval '24 hours';
  
  IF _gifts_today >= 10 THEN
    RETURN json_build_object('success', false, 'error', 'Limite de cadeaux atteinte (10/jour)');
  END IF;

  -- Deduct credits from sender
  DECLARE
    _deduct_result JSON;
  BEGIN
    _deduct_result := public.deduct_credits(_sender_id, _amount, 'credit_gift', 'Cadeau de ' || _amount || ' crédits');
    IF NOT (_deduct_result->>'success')::boolean THEN
      RETURN json_build_object('success', false, 'error', 'Crédits insuffisants');
    END IF;
  END;

  -- Add bonus credits to recipient
  PERFORM public.add_credits(_recipient_id, _amount, 'bonus', 'credit_gift_received', 'Cadeau reçu de ' || _amount || ' crédits');

  -- Record the gift
  INSERT INTO public.credit_gifts (sender_id, recipient_id, amount, message_id)
  VALUES (_sender_id, _recipient_id, _amount, _message_id)
  RETURNING id INTO _gift_id;

  -- Notify recipient
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (
    _recipient_id,
    'credit_gift',
    '🎁 Cadeau reçu !',
    'Tu as reçu ' || _amount || ' crédits bonus en cadeau !',
    false
  );

  RETURN json_build_object('success', true, 'gift_id', _gift_id);
END;
$$;
