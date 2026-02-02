
-- Create credit_type enum
CREATE TYPE public.credit_type AS ENUM ('daily', 'bonus', 'purchased');

-- Table user_credits - Stockage des soldes de crédits par utilisateur
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_credits DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_credits DECIMAL(10,2) NOT NULL DEFAULT 0,
  purchased_credits DECIMAL(10,2) NOT NULL DEFAULT 0,
  daily_claims_used INTEGER NOT NULL DEFAULT 0,
  last_daily_claim TIMESTAMPTZ,
  monthly_reset_date TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table credit_transactions - Historique de toutes les transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  credit_type public.credit_type NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table nearby_profiles_unlock - Déblocages de profils à proximité
CREATE TABLE public.nearby_profiles_unlock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('30_extra', '130_extra')),
  credits_spent DECIMAL(10,2) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Table profile_view_credits - Suivi des vues de profils
CREATE TABLE public.profile_view_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_spent DECIMAL(10,2) NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(viewer_user_id, viewed_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_profiles_unlock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_view_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
  ON public.user_credits FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all credits"
  ON public.user_credits FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for nearby_profiles_unlock
CREATE POLICY "Users can view their own unlocks"
  ON public.nearby_profiles_unlock FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocks"
  ON public.nearby_profiles_unlock FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all unlocks"
  ON public.nearby_profiles_unlock FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for profile_view_credits
CREATE POLICY "Users can view their own profile views"
  ON public.profile_view_credits FOR SELECT
  USING (auth.uid() = viewer_user_id);

CREATE POLICY "Users can insert their own profile views"
  ON public.profile_view_credits FOR INSERT
  WITH CHECK (auth.uid() = viewer_user_id);

CREATE POLICY "Admins can view all profile views"
  ON public.profile_view_credits FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function: Get user credit balance
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  credits_record RECORD;
BEGIN
  SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    -- Create initial credits for new user (15 = 10 inscription + 5 bienvenue)
    INSERT INTO user_credits (user_id, bonus_credits)
    VALUES (_user_id, 15.0)
    RETURNING * INTO credits_record;
    
    -- Log the signup bonus
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, 15.0, 'bonus', 'signup_bonus', 'Bonus d''inscription (10) + Bienvenue (5)');
  END IF;
  
  -- Check and reset monthly claims if needed
  IF credits_record.monthly_reset_date < date_trunc('month', now()) THEN
    UPDATE user_credits 
    SET daily_claims_used = 0, 
        monthly_reset_date = date_trunc('month', now()),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO credits_record;
  END IF;
  
  result := json_build_object(
    'user_id', credits_record.user_id,
    'daily_credits', credits_record.daily_credits,
    'bonus_credits', credits_record.bonus_credits,
    'purchased_credits', credits_record.purchased_credits,
    'total_credits', credits_record.daily_credits + credits_record.bonus_credits + credits_record.purchased_credits,
    'daily_claims_used', credits_record.daily_claims_used,
    'can_claim_daily', credits_record.daily_claims_used < 7 AND (credits_record.last_daily_claim IS NULL OR credits_record.last_daily_claim < now() - interval '24 hours'),
    'last_daily_claim', credits_record.last_daily_claim,
    'monthly_reset_date', credits_record.monthly_reset_date
  );
  
  RETURN result;
END;
$$;

-- Function: Check sufficient credits
CREATE OR REPLACE FUNCTION public.check_sufficient_credits(_user_id UUID, _amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(daily_credits, 0) + COALESCE(bonus_credits, 0) + COALESCE(purchased_credits, 0)
  INTO total
  FROM user_credits
  WHERE user_id = _user_id;
  
  RETURN COALESCE(total, 0) >= _amount;
END;
$$;

-- Function: Deduct credits (priority: daily > bonus > purchased)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  _user_id UUID, 
  _amount DECIMAL, 
  _transaction_type TEXT, 
  _description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits_record RECORD;
  remaining DECIMAL;
  deducted_daily DECIMAL := 0;
  deducted_bonus DECIMAL := 0;
  deducted_purchased DECIMAL := 0;
BEGIN
  -- Get current credits
  SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User credits not found');
  END IF;
  
  -- Check total balance
  IF (credits_record.daily_credits + credits_record.bonus_credits + credits_record.purchased_credits) < _amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  remaining := _amount;
  
  -- 1. Deduct from daily credits first
  IF remaining > 0 AND credits_record.daily_credits > 0 THEN
    deducted_daily := LEAST(remaining, credits_record.daily_credits);
    remaining := remaining - deducted_daily;
  END IF;
  
  -- 2. Deduct from bonus credits
  IF remaining > 0 AND credits_record.bonus_credits > 0 THEN
    deducted_bonus := LEAST(remaining, credits_record.bonus_credits);
    remaining := remaining - deducted_bonus;
  END IF;
  
  -- 3. Deduct from purchased credits
  IF remaining > 0 AND credits_record.purchased_credits > 0 THEN
    deducted_purchased := LEAST(remaining, credits_record.purchased_credits);
    remaining := remaining - deducted_purchased;
  END IF;
  
  -- Update credits
  UPDATE user_credits
  SET 
    daily_credits = daily_credits - deducted_daily,
    bonus_credits = bonus_credits - deducted_bonus,
    purchased_credits = purchased_credits - deducted_purchased,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Log transactions for each credit type used
  IF deducted_daily > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -deducted_daily, 'daily', _transaction_type, _description);
  END IF;
  
  IF deducted_bonus > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -deducted_bonus, 'bonus', _transaction_type, _description);
  END IF;
  
  IF deducted_purchased > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (_user_id, -deducted_purchased, 'purchased', _transaction_type, _description);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'deducted_daily', deducted_daily,
    'deducted_bonus', deducted_bonus,
    'deducted_purchased', deducted_purchased,
    'total_deducted', _amount
  );
END;
$$;

-- Function: Add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id UUID, 
  _amount DECIMAL, 
  _credit_type public.credit_type,
  _transaction_type TEXT,
  _description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user has credits record
  INSERT INTO user_credits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add credits based on type
  IF _credit_type = 'daily' THEN
    UPDATE user_credits SET daily_credits = daily_credits + _amount, updated_at = now() WHERE user_id = _user_id;
  ELSIF _credit_type = 'bonus' THEN
    UPDATE user_credits SET bonus_credits = bonus_credits + _amount, updated_at = now() WHERE user_id = _user_id;
  ELSIF _credit_type = 'purchased' THEN
    UPDATE user_credits SET purchased_credits = purchased_credits + _amount, updated_at = now() WHERE user_id = _user_id;
  END IF;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
  VALUES (_user_id, _amount, _credit_type, _transaction_type, _description);
  
  RETURN json_build_object('success', true, 'amount_added', _amount, 'credit_type', _credit_type);
END;
$$;

-- Function: Claim daily credits
CREATE OR REPLACE FUNCTION public.claim_daily_credits(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits_record RECORD;
BEGIN
  -- Get or create credits record
  INSERT INTO user_credits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  -- Check and reset monthly claims if needed
  IF credits_record.monthly_reset_date < date_trunc('month', now()) THEN
    UPDATE user_credits 
    SET daily_claims_used = 0, 
        monthly_reset_date = date_trunc('month', now())
    WHERE user_id = _user_id
    RETURNING * INTO credits_record;
  END IF;
  
  -- Check if can claim (max 7 per month, once per 24h)
  IF credits_record.daily_claims_used >= 7 THEN
    RETURN json_build_object('success', false, 'error', 'Maximum 7 claims per month reached');
  END IF;
  
  IF credits_record.last_daily_claim IS NOT NULL AND credits_record.last_daily_claim > now() - interval '24 hours' THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed today', 'next_claim_at', credits_record.last_daily_claim + interval '24 hours');
  END IF;
  
  -- Reset daily credits to 5 (non-cumulative)
  UPDATE user_credits
  SET 
    daily_credits = 5.0,
    daily_claims_used = daily_claims_used + 1,
    last_daily_claim = now(),
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, credit_type, transaction_type, description)
  VALUES (_user_id, 5.0, 'daily', 'daily_claim', 'Réclamation quotidienne de crédits');
  
  RETURN json_build_object('success', true, 'credits_claimed', 5.0, 'claims_remaining', 7 - credits_record.daily_claims_used - 1);
END;
$$;

-- Function: Add credits for identity verification
CREATE OR REPLACE FUNCTION public.add_verification_credits(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN add_credits(_user_id, 30.0, 'bonus', 'identity_verification', 'Bonus vérification d''identité');
END;
$$;

-- Function: Process referral credits (called when referred user verifies identity)
CREATE OR REPLACE FUNCTION public.process_referral_credits(_referrer_id UUID, _referred_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add 10 credits to referrer
  PERFORM add_credits(_referrer_id, 10.0, 'bonus', 'referral_bonus', 'Bonus parrainage - filleul vérifié');
  
  -- Add 10 credits to referred
  PERFORM add_credits(_referred_id, 10.0, 'bonus', 'referral_bonus', 'Bonus parrainage - inscription vérifiée');
  
  RETURN json_build_object('success', true, 'referrer_credits', 10.0, 'referred_credits', 10.0);
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_nearby_profiles_unlock_user_expires ON public.nearby_profiles_unlock(user_id, expires_at);
CREATE INDEX idx_profile_view_credits_viewer ON public.profile_view_credits(viewer_user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
