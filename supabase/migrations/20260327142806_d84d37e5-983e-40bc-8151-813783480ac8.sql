
CREATE TABLE public.profile_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_user_id UUID NOT NULL,
  visitor_user_id UUID NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visited_user_id, visitor_user_id)
);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see who visited their profile"
  ON public.profile_visits FOR SELECT
  TO authenticated
  USING (visited_user_id = auth.uid() OR visitor_user_id = auth.uid());

CREATE POLICY "Authenticated users can insert visits"
  ON public.profile_visits FOR INSERT
  TO authenticated
  WITH CHECK (visitor_user_id = auth.uid());

CREATE POLICY "Users can update their own visits"
  ON public.profile_visits FOR UPDATE
  TO authenticated
  USING (visitor_user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_visits;
