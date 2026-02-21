-- Allow group admins to update member roles
CREATE POLICY "Group admins can update members"
ON public.chat_room_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members m
    WHERE m.chat_room_id = chat_room_members.chat_room_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_members m
    WHERE m.chat_room_id = chat_room_members.chat_room_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);