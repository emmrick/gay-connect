
-- ============ ENUM ============
DO $$ BEGIN
  CREATE TYPE public.plan_now_status AS ENUM ('active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLE: plan_now_sessions ============
CREATE TABLE IF NOT EXISTS public.plan_now_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status public.plan_now_status NOT NULL DEFAULT 'active',
  credits_spent NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_now_sessions_active
  ON public.plan_now_sessions (user_id, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_plan_now_sessions_expires
  ON public.plan_now_sessions (expires_at)
  WHERE status = 'active';

ALTER TABLE public.plan_now_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active sessions"
  ON public.plan_now_sessions FOR SELECT
  TO authenticated
  USING (status = 'active' AND expires_at > now());

CREATE POLICY "Users can view their own sessions"
  ON public.plan_now_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.plan_now_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.plan_now_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============ TABLE: plan_now_auto_replies ============
CREATE TABLE IF NOT EXISTS public.plan_now_auto_replies (
  user_id UUID PRIMARY KEY,
  looking_for TEXT,
  available_now TEXT,
  photo_exchange TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_now_auto_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auto replies"
  ON public.plan_now_auto_replies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto replies"
  ON public.plan_now_auto_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto replies"
  ON public.plan_now_auto_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto replies"
  ON public.plan_now_auto_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============ Updated_at triggers ============
CREATE TRIGGER trg_plan_now_sessions_updated_at
  BEFORE UPDATE ON public.plan_now_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_plan_now_auto_replies_updated_at
  BEFORE UPDATE ON public.plan_now_auto_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Expiration helper ============
CREATE OR REPLACE FUNCTION public.expire_plan_now_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.plan_now_sessions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at <= now();
END;
$$;

-- ============ Has-active-session helper ============
CREATE OR REPLACE FUNCTION public.has_active_plan_now(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plan_now_sessions
    WHERE user_id = _user_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;

-- ============ Credit cost entry ============
INSERT INTO public.credit_costs (cost_key, cost_value, label, category)
VALUES ('plan_now_activation', 5, 'Activation Plan Now (30 min)', 'plan_now')
ON CONFLICT (cost_key) DO NOTHING;

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_now_sessions;
