-- Allow anonymous/public inserts into ads table for advertiser submissions
CREATE POLICY "Anyone can submit ad requests"
ON public.ads
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending' AND is_active = false);