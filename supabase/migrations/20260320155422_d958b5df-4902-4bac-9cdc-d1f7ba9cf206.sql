
-- Tighten impression/click insert policies to require user_id match
DROP POLICY "Authenticated users can log impressions" ON public.ad_impressions;
DROP POLICY "Authenticated users can log clicks" ON public.ad_clicks;

CREATE POLICY "Users can log own impressions" ON public.ad_impressions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can log own clicks" ON public.ad_clicks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
