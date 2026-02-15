
-- Allow users to join non-custom (regional) groups themselves
CREATE POLICY "Users can join regional groups"
ON public.chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = chat_room_members.chat_room_id 
    AND is_custom = false
  )
);
