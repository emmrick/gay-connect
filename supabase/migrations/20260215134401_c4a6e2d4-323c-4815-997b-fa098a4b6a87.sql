
-- Table for profile boosts
CREATE TABLE public.profile_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  credits_spent NUMERIC NOT NULL DEFAULT 10.0,
  views_delivered INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own boosts"
  ON public.profile_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boosts"
  ON public.profile_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read active boosts"
  ON public.profile_boosts FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own boosts"
  ON public.profile_boosts FOR UPDATE
  USING (auth.uid() = user_id);

-- Regular index (no partial predicate with now())
CREATE INDEX idx_profile_boosts_expires ON public.profile_boosts (expires_at DESC);
