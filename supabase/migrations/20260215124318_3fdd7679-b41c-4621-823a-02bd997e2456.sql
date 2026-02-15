
-- Allow authenticated users to create custom chat rooms
CREATE POLICY "Users can create custom groups"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (is_custom = true AND created_by = auth.uid());

-- Allow group admins to add members
CREATE POLICY "Group admins can add members"
ON public.chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members m
    WHERE m.chat_room_id = chat_room_members.chat_room_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "Users can join groups" ON public.chat_room_members;
