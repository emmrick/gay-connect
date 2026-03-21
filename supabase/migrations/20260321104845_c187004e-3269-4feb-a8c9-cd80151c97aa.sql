
-- Table for admin-managed ad-free subscription plans
CREATE TABLE public.ad_free_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  credits_cost INTEGER NOT NULL,
  tag TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_free_plans ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active plans
CREATE POLICY "Anyone can read active ad-free plans"
ON public.ad_free_plans FOR SELECT TO authenticated
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage ad-free plans"
ON public.ad_free_plans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_ad_free_plans_updated_at
BEFORE UPDATE ON public.ad_free_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default plans
INSERT INTO public.ad_free_plans (label, duration_days, credits_cost, tag, is_popular, display_order) VALUES
  ('7 jours', 7, 7, 'Flexible', false, 1),
  ('15 jours', 15, 15, 'Populaire', true, 2),
  ('30 jours', 30, 30, 'Meilleur prix', false, 3);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_free_plans;

-- Update subscribe_ad_free to accept dynamic plans
CREATE OR REPLACE FUNCTION public.subscribe_ad_free(_user_id uuid, _plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _plan RECORD;
  _deduct_result json;
  _expires_at timestamptz;
  _existing_expires timestamptz;
  _sub_id uuid;
BEGIN
  -- Get plan
  SELECT * INTO _plan FROM public.ad_free_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan invalide ou inactif');
  END IF;

  -- Check caller
  IF auth.uid() != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Deduct credits
  _deduct_result := public.deduct_credits(_user_id, _plan.credits_cost::numeric, 'ad_free_subscription', 'Abonnement sans pub (' || _plan.label || ')');
  IF NOT (_deduct_result->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', COALESCE(_deduct_result->>'error', 'Crédits insuffisants'));
  END IF;

  -- Check existing active subscription to extend
  SELECT expires_at INTO _existing_expires
  FROM public.ad_free_subscriptions
  WHERE user_id = _user_id AND is_active = true AND expires_at > now()
  ORDER BY expires_at DESC LIMIT 1;

  IF _existing_expires IS NOT NULL THEN
    _expires_at := _existing_expires + (_plan.duration_days || ' days')::interval;
  ELSE
    _expires_at := now() + (_plan.duration_days || ' days')::interval;
  END IF;

  -- Deactivate old
  UPDATE public.ad_free_subscriptions SET is_active = false WHERE user_id = _user_id;

  -- Create new
  INSERT INTO public.ad_free_subscriptions (user_id, credits_paid, starts_at, expires_at, is_active, payment_plan)
  VALUES (_user_id, _plan.credits_cost, now(), _expires_at, true, _plan.label)
  RETURNING id INTO _sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', _sub_id,
    'expires_at', _expires_at,
    'credits_paid', _plan.credits_cost
  );
END;
$$;
