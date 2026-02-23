
-- Moderators can view all credit purchase requests
CREATE POLICY "Moderators can view all purchase requests"
ON public.credit_purchase_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can update credit purchase requests
CREATE POLICY "Moderators can update purchase requests"
ON public.credit_purchase_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can view AI moderation reports
CREATE POLICY "Moderators can manage AI moderation reports"
ON public.ai_moderation_reports FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can insert/view broadcasts
CREATE POLICY "Moderators can view broadcast history"
ON public.broadcast_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can insert broadcasts"
ON public.broadcast_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can insert moderation actions
CREATE POLICY "Moderators can insert moderation actions"
ON public.moderation_actions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Admins/Moderators can view all screenshot violations
CREATE POLICY "Staff can view all violations"
ON public.screenshot_violations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins/Moderators can update screenshot violations
CREATE POLICY "Staff can update violations"
ON public.screenshot_violations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can view/update withdrawal requests
CREATE POLICY "Moderators can view all withdrawals"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update withdrawal requests"
ON public.withdrawal_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));
