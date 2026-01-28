-- Allow region list to be readable during signup (anon) and after login (authenticated)
-- This table contains only department codes/names (no PII).

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat rooms are viewable by authenticated users" ON public.chat_rooms;
DROP POLICY IF EXISTS "Chat rooms are viewable by everyone" ON public.chat_rooms;

CREATE POLICY "Chat rooms are viewable by everyone"
ON public.chat_rooms
FOR SELECT
TO anon, authenticated
USING (true);
