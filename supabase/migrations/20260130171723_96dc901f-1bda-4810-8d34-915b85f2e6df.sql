-- Update RLS policy to allow recipients to update read_at on messages they received
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Enable realtime for messages read_at updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;