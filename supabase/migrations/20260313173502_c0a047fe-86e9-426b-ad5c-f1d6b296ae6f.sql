
CREATE OR REPLACE FUNCTION public.check_sufficient_credits(_user_id uuid, _amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  available DECIMAL;
  v_credits user_credits%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN false;
  END IF;

  SELECT * INTO v_credits FROM user_credits WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  available := COALESCE(v_credits.daily_credits, 0);
  
  IF NOT COALESCE(v_credits.lock_passive, false) THEN
    available := available + COALESCE(v_credits.passive_credits, 0);
  END IF;
  
  IF NOT COALESCE(v_credits.lock_bonus, false) THEN
    available := available + COALESCE(v_credits.bonus_credits, 0);
  END IF;
  
  IF NOT COALESCE(v_credits.lock_purchased, false) THEN
    available := available + COALESCE(v_credits.purchased_credits, 0);
  END IF;

  RETURN available >= _amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id uuid, _amount numeric, _transaction_type text, _description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining numeric := _amount;
  v_from_passive numeric := 0;
  v_from_daily numeric := 0;
  v_from_bonus numeric := 0;
  v_from_purchased numeric := 0;
  v_available numeric;
  v_has_locked boolean;
  v_deduct numeric;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User credits not found');
  END IF;

  v_has_locked := COALESCE(v_credits.lock_passive, false) OR COALESCE(v_credits.lock_bonus, false) OR COALESCE(v_credits.lock_purchased, false);

  v_available := COALESCE(v_credits.daily_credits, 0);
  IF NOT COALESCE(v_credits.lock_passive, false) THEN
    v_available := v_available + COALESCE(v_credits.passive_credits, 0);
  END IF;
  IF NOT COALESCE(v_credits.lock_bonus, false) THEN
    v_available := v_available + COALESCE(v_credits.bonus_credits, 0);
  END IF;
  IF NOT COALESCE(v_credits.lock_purchased, false) THEN
    v_available := v_available + COALESCE(v_credits.purchased_credits, 0);
  END IF;
  
  IF v_available < _amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits', 'has_locked', v_has_locked);
  END IF;

  IF v_remaining > 0 AND v_credits.daily_credits > 0 THEN
    v_deduct := LEAST(v_remaining, v_credits.daily_credits);
    v_from_daily := v_deduct;
    v_remaining := v_remaining - v_deduct;
  END IF;

  IF v_remaining > 0 AND COALESCE(v_credits.passive_credits, 0) > 0 AND NOT COALESCE(v_credits.lock_passive, false) THEN
    v_deduct := LEAST(v_remaining, COALESCE(v_credits.passive_credits, 0));
    v_from_passive := v_deduct;
    v_remaining := v_remaining - v_deduct;
  END IF;

  IF v_remaining > 0 AND v_credits.bonus_credits > 0 AND NOT COALESCE(v_credits.lock_bonus, false) THEN
    v_deduct := LEAST(v_remaining, v_credits.bonus_credits);
    v_from_bonus := v_deduct;
    v_remaining := v_remaining - v_deduct;
  END IF;

  IF v_remaining > 0 AND v_credits.purchased_credits > 0 AND NOT COALESCE(v_credits.lock_purchased, false) THEN
    v_deduct := LEAST(v_remaining, v_credits.purchased_credits);
    v_from_purchased := v_deduct;
    v_remaining := v_remaining - v_deduct;
  END IF;

  IF v_remaining > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient unlocked credits', 'has_locked', true);
  END IF;

  UPDATE user_credits
  SET passive_credits = COALESCE(passive_credits, 0) - v_from_passive,
      daily_credits = daily_credits - v_from_daily,
      bonus_credits = bonus_credits - v_from_bonus,
      purchased_credits = purchased_credits - v_from_purchased,
      last_passive_credit_at = CASE WHEN v_from_passive > 0 THEN now() ELSE last_passive_credit_at END,
      updated_at = now()
  WHERE user_id = _user_id;

  IF v_from_daily > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -v_from_daily, 'daily', _transaction_type, _description);
  END IF;

  IF v_from_passive > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -v_from_passive, 'passive', _transaction_type, _description);
  END IF;

  IF v_from_bonus > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -v_from_bonus, 'bonus', _transaction_type, _description);
  END IF;

  IF v_from_purchased > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -v_from_purchased, 'purchased', _transaction_type, _description);
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;
