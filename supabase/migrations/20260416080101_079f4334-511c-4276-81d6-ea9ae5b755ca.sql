
-- Add weekly tracking columns
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS weekly_credits_given numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_reset_date date NOT NULL DEFAULT CURRENT_DATE;

-- Rewrite the credit balance function
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_hours_passed numeric;
  v_passive_to_add numeric;
  v_new_passive numeric;
  v_max_daily numeric := 5.0;
  v_max_weekly numeric := 35.0;
  v_top_up numeric;
  v_actual_passive_added numeric;
  v_recharge_amount numeric;
  v_recharge_interval numeric;
  v_recharge_max numeric;
  v_weekly_remaining numeric;
BEGIN
  -- Get dynamic passive recharge settings
  SELECT cost_value INTO v_recharge_amount FROM credit_costs WHERE cost_key = 'passive_recharge_amount';
  v_recharge_amount := COALESCE(v_recharge_amount, 0.1);

  SELECT cost_value INTO v_recharge_interval FROM credit_costs WHERE cost_key = 'passive_recharge_interval_hours';
  v_recharge_interval := COALESCE(v_recharge_interval, 6);

  SELECT cost_value INTO v_recharge_max FROM credit_costs WHERE cost_key = 'passive_recharge_max';
  v_recharge_max := COALESCE(v_recharge_max, 10.0);

  -- Get or create credits record
  INSERT INTO user_credits (user_id, daily_credits, bonus_credits, purchased_credits, passive_credits, last_passive_credit_at, weekly_credits_given, weekly_reset_date)
  VALUES (_user_id, v_max_daily, 0, 0, 0, now(), 5, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_credits FROM user_credits WHERE user_id = _user_id;

  -- === Passive credits recharge ===
  v_hours_passed := EXTRACT(EPOCH FROM (now() - COALESCE(v_credits.last_passive_credit_at, now()))) / 3600;
  v_passive_to_add := FLOOR(v_hours_passed / v_recharge_interval) * v_recharge_amount;
  
  IF v_passive_to_add > 0 THEN
    v_new_passive := LEAST(COALESCE(v_credits.passive_credits, 0) + v_passive_to_add, v_recharge_max);
    v_actual_passive_added := v_new_passive - COALESCE(v_credits.passive_credits, 0);
    
    IF v_actual_passive_added > 0 THEN
      UPDATE user_credits 
      SET passive_credits = v_new_passive,
          last_passive_credit_at = now()
      WHERE user_id = _user_id;
      
      INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
      VALUES (_user_id, v_actual_passive_added, 'passive', 'passive_recharge', 'Recharge passive automatique (+'|| v_actual_passive_added ||')');
      
      v_credits.passive_credits := v_new_passive;
    END IF;
  END IF;

  -- === Weekly period reset (every 7 days) ===
  IF CURRENT_DATE >= v_credits.weekly_reset_date + 7 THEN
    UPDATE user_credits
    SET weekly_credits_given = 0,
        weekly_reset_date = CURRENT_DATE
    WHERE user_id = _user_id;
    v_credits.weekly_credits_given := 0;
    v_credits.weekly_reset_date := CURRENT_DATE;
  END IF;

  -- === Daily top-up logic ===
  IF v_credits.daily_credits_last_reset IS NULL OR 
     v_credits.daily_credits_last_reset < CURRENT_DATE THEN
    
    -- Calculate how much weekly quota remains
    v_weekly_remaining := GREATEST(v_max_weekly - v_credits.weekly_credits_given, 0);
    
    IF v_weekly_remaining > 0 AND v_credits.daily_credits < v_max_daily THEN
      -- Calculate complement needed to reach 5
      v_top_up := v_max_daily - v_credits.daily_credits;
      
      -- Cap by weekly remaining quota
      v_top_up := LEAST(v_top_up, v_weekly_remaining);
      
      IF v_top_up > 0 THEN
        UPDATE user_credits 
        SET daily_credits = daily_credits + v_top_up,
            daily_credits_last_reset = CURRENT_DATE,
            weekly_credits_given = weekly_credits_given + v_top_up,
            updated_at = now()
        WHERE user_id = _user_id;
        
        v_credits.daily_credits := v_credits.daily_credits + v_top_up;
        v_credits.weekly_credits_given := v_credits.weekly_credits_given + v_top_up;
        
        INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
        VALUES (_user_id, v_top_up, 'daily', 'daily_recharge', 'Recharge quotidienne (+' || v_top_up || ')');
      ELSE
        UPDATE user_credits 
        SET daily_credits_last_reset = CURRENT_DATE
        WHERE user_id = _user_id;
      END IF;
    ELSE
      -- No weekly quota left or already at 5, just mark as processed today
      UPDATE user_credits 
      SET daily_credits_last_reset = CURRENT_DATE
      WHERE user_id = _user_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'user_id', v_credits.user_id,
    'passive_credits', COALESCE(v_credits.passive_credits, 0),
    'daily_credits', v_credits.daily_credits,
    'bonus_credits', v_credits.bonus_credits,
    'purchased_credits', v_credits.purchased_credits,
    'total_credits', COALESCE(v_credits.passive_credits, 0) + v_credits.daily_credits + v_credits.bonus_credits + v_credits.purchased_credits,
    'max_daily_credits', v_max_daily,
    'daily_credits_reset_date', v_credits.daily_credits_last_reset,
    'weekly_credits_given', v_credits.weekly_credits_given,
    'weekly_credits_remaining', GREATEST(v_max_weekly - v_credits.weekly_credits_given, 0),
    'weekly_reset_date', v_credits.weekly_reset_date,
    'lock_passive', COALESCE(v_credits.lock_passive, false),
    'lock_bonus', COALESCE(v_credits.lock_bonus, false),
    'lock_purchased', COALESCE(v_credits.lock_purchased, false)
  );
END;
$function$;
