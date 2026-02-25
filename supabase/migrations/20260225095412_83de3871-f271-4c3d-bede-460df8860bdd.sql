
-- Create a security definer function to check group admin status (avoids self-referencing RLS)
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _chat_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE user_id = _user_id
      AND chat_room_id = _chat_room_id
      AND role = 'admin'
  )
$$;

-- Drop existing restrictive DELETE policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_room_members;
CREATE POLICY "Admins can manage members"
  ON public.chat_room_members
  FOR DELETE
  TO authenticated
  USING (public.is_group_admin(auth.uid(), chat_room_id));

-- Drop existing restrictive UPDATE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Group admins can update members" ON public.chat_room_members;
CREATE POLICY "Group admins can update members"
  ON public.chat_room_members
  FOR UPDATE
  TO authenticated
  USING (public.is_group_admin(auth.uid(), chat_room_id))
  WITH CHECK (public.is_group_admin(auth.uid(), chat_room_id));
