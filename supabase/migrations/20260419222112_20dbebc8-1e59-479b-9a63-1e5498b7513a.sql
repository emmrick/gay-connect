-- 1. Table credit_promotions
CREATE TABLE public.credit_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_promotions_dates_check CHECK (ends_at > starts_at)
);

CREATE INDEX idx_credit_promotions_active ON public.credit_promotions (is_active, starts_at, ends_at);

ALTER TABLE public.credit_promotions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active promotions"
ON public.credit_promotions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage promotions"
ON public.credit_promotions FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.can_manage_credits(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.can_manage_credits(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_credit_promotions_updated_at
BEFORE UPDATE ON public.credit_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Fonction get_active_credit_promotion
CREATE OR REPLACE FUNCTION public.get_active_credit_promotion()
RETURNS TABLE (
  id UUID,
  label TEXT,
  description TEXT,
  discount_percent NUMERIC,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, label, description, discount_percent, starts_at, ends_at
  FROM public.credit_promotions
  WHERE is_active = true
    AND starts_at <= now()
    AND ends_at > now()
  ORDER BY discount_percent DESC, ends_at ASC
  LIMIT 1;
$$;

-- 3. Colonne highest_balance_ever sur user_credits
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS highest_balance_ever NUMERIC NOT NULL DEFAULT 0;

-- Initialiser avec le solde courant
UPDATE public.user_credits
SET highest_balance_ever = GREATEST(
  COALESCE(daily_credits, 0) + COALESCE(passive_credits, 0) + COALESCE(bonus_credits, 0) + COALESCE(purchased_credits, 0),
  highest_balance_ever
);

-- Trigger pour mettre à jour highest_balance_ever
CREATE OR REPLACE FUNCTION public.update_highest_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_total NUMERIC;
BEGIN
  current_total := COALESCE(NEW.daily_credits, 0) 
                 + COALESCE(NEW.passive_credits, 0) 
                 + COALESCE(NEW.bonus_credits, 0) 
                 + COALESCE(NEW.purchased_credits, 0);
  
  IF current_total > COALESCE(NEW.highest_balance_ever, 0) THEN
    NEW.highest_balance_ever := current_total;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_highest_balance
BEFORE INSERT OR UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_highest_balance();

-- 4. Modifier deduct_credits pour appliquer la promotion
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
  v_promo RECORD;
  v_original_amount numeric := _amount;
  v_discount_applied numeric := 0;
BEGIN
  -- Appliquer la promotion active si elle existe
  SELECT * INTO v_promo FROM public.get_active_credit_promotion();
  IF FOUND THEN
    v_discount_applied := ROUND((_amount * v_promo.discount_percent / 100)::numeric, 2);
    _amount := GREATEST(0, _amount - v_discount_applied);
    v_remaining := _amount;
  END IF;

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

  RETURN json_build_object(
    'success', true,
    'original_amount', v_original_amount,
    'final_amount', _amount,
    'discount_applied', v_discount_applied,
    'promo_label', CASE WHEN v_promo IS NOT NULL THEN v_promo.label ELSE NULL END
  );
END;
$function$;

-- Activer realtime sur credit_promotions pour mises à jour live
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_promotions;