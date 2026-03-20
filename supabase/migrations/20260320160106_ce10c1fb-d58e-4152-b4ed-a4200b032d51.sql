
-- Function to subscribe to ad-free using credits
CREATE OR REPLACE FUNCTION public.subscribe_ad_free(
  _user_id uuid,
  _plan text DEFAULT '30_once'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits_cost numeric;
  _duration_days integer;
  _deduct_result json;
  _expires_at timestamptz;
  _existing_expires timestamptz;
  _sub_id uuid;
BEGIN
  -- Validate plan
  IF _plan = '30_once' THEN
    _credits_cost := 30;
    _duration_days := 30;
  ELSIF _plan = '15_biweekly' THEN
    _credits_cost := 15;
    _duration_days := 15;
  ELSIF _plan = '7_weekly' THEN
    _credits_cost := 7;
    _duration_days := 7;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Plan invalide');
  END IF;

  -- Check caller is the user
  IF auth.uid() != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Deduct credits
  _deduct_result := public.deduct_credits(_user_id, _credits_cost, 'ad_free_subscription', 'Abonnement sans pub (' || _plan || ')');
  
  IF NOT (_deduct_result->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', COALESCE(_deduct_result->>'error', 'Crédits insuffisants'));
  END IF;

  -- Check existing active subscription to extend
  SELECT expires_at INTO _existing_expires
  FROM public.ad_free_subscriptions
  WHERE user_id = _user_id AND is_active = true AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF _existing_expires IS NOT NULL THEN
    _expires_at := _existing_expires + (_duration_days || ' days')::interval;
  ELSE
    _expires_at := now() + (_duration_days || ' days')::interval;
  END IF;

  -- Deactivate old subscriptions
  UPDATE public.ad_free_subscriptions
  SET is_active = false
  WHERE user_id = _user_id;

  -- Create new subscription
  INSERT INTO public.ad_free_subscriptions (user_id, credits_paid, starts_at, expires_at, is_active, payment_plan)
  VALUES (_user_id, _credits_cost, now(), _expires_at, true, _plan)
  RETURNING id INTO _sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', _sub_id,
    'expires_at', _expires_at,
    'credits_paid', _credits_cost
  );
END;
$$;
