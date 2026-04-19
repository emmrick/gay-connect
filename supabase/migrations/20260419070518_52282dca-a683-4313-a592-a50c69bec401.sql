
-- Allow admins and moderators with content management permission to view all messages
CREATE POLICY "Admins and content moderators can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.moderator_permissions mp
    WHERE mp.user_id = auth.uid()
      AND mp.can_manage_content = true
  )
);
