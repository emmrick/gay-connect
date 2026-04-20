
-- Table dédiée aux épingles en messagerie privée
CREATE TABLE public.private_pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT private_pinned_unique UNIQUE (message_id, user_a_id, user_b_id),
  CONSTRAINT private_pinned_user_order CHECK (user_a_id < user_b_id)
);

CREATE INDEX idx_private_pinned_users ON public.private_pinned_messages (user_a_id, user_b_id, pinned_at DESC);

ALTER TABLE public.private_pinned_messages ENABLE ROW LEVEL SECURITY;

-- SELECT : participants seulement
CREATE POLICY "participants_can_view_private_pins"
ON public.private_pinned_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- INSERT : participant épingle un message de la conversation (qu'il a envoyé OU reçu)
CREATE POLICY "participants_can_pin"
ON public.private_pinned_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  AND auth.uid() = pinned_by
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND m.is_private = true
      AND (
        (m.sender_id = user_a_id AND m.recipient_id = user_b_id)
        OR (m.sender_id = user_b_id AND m.recipient_id = user_a_id)
      )
  )
);

-- DELETE : participants seulement
CREATE POLICY "participants_can_unpin"
ON public.private_pinned_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_pinned_messages;
