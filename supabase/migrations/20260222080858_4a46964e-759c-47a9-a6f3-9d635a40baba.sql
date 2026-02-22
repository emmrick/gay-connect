-- Allow moderators to update identity_verifications (for requesting re-verification)
CREATE POLICY "Moderators can update verifications"
ON public.identity_verifications
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to insert identity_verifications (for creating verification requests)
CREATE POLICY "Moderators can insert verifications"
ON public.identity_verifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all identity verifications
CREATE POLICY "Moderators can view all verifications"
ON public.identity_verifications
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to delete verifications (for cleanup)
CREATE POLICY "Moderators can delete verifications"
ON public.identity_verifications
FOR DELETE
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update profiles (needed for revoking verification status)
CREATE POLICY "Moderators can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'::app_role));
