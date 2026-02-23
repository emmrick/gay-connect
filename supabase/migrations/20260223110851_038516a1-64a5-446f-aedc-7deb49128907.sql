
-- Fix: Allow moderators to update maintenance_mode
CREATE POLICY "Moderators can update maintenance mode"
ON public.maintenance_mode FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Fix: Allow moderators to view all reports
CREATE POLICY "Moderators can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Fix: Allow moderators to update reports
CREATE POLICY "Moderators can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Fix: Allow moderators to view all blocks
CREATE POLICY "Moderators can view all blocks"
ON public.user_blocks FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Fix: Allow moderators to insert blocks
CREATE POLICY "Moderators can insert blocks"
ON public.user_blocks FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Fix: Allow moderators to update blocks
CREATE POLICY "Moderators can update blocks"
ON public.user_blocks FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));
