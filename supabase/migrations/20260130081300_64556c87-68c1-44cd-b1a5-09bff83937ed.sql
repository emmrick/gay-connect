-- Allow users to update their own messages (for soft delete)
CREATE POLICY "Users can soft delete their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());