-- Allow users to delete their own rejected verification (to resubmit)
CREATE POLICY "Users can delete their rejected verification"
ON public.identity_verifications
FOR DELETE
USING (auth.uid() = user_id AND status = 'rejected');

-- Allow admins to insert verifications (for manual verification)
CREATE POLICY "Admins can insert verifications"
ON public.identity_verifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete verifications
CREATE POLICY "Admins can delete verifications"
ON public.identity_verifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));