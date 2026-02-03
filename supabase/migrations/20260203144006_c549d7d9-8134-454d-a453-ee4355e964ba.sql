
-- Update the credit system to automatic daily reset at midnight
-- Remove the manual claim system and implement auto-refresh

-- Add column to track when daily credits were last reset
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS daily_credits_last_reset DATE DEFAULT CURRENT_DATE;

-- Update get_user_credit_balance to auto-reset daily credits at midnight
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  credits_record RECORD;
  max_daily CONSTANT DECIMAL := 5.0;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get or create credits record
  INSERT INTO user_credits (user_id, daily_credits, daily_credits_last_reset)
  VALUES (_user_id, max_daily, today)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  -- Auto-reset daily credits if it's a new day
  IF credits_record.daily_credits_last_reset IS NULL OR credits_record.daily_credits_last_reset < today THEN
    UPDATE user_credits 
    SET 
      daily_credits = max_daily,
      daily_credits_last_reset = today,
      updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO credits_record;
  END IF;
  
  RETURN json_build_object(
    'user_id', _user_id,
    'daily_credits', credits_record.daily_credits,
    'bonus_credits', credits_record.bonus_credits,
    'purchased_credits', credits_record.purchased_credits,
    'total_credits', credits_record.daily_credits + credits_record.bonus_credits + credits_record.purchased_credits,
    'max_daily_credits', max_daily,
    'daily_credits_reset_date', credits_record.daily_credits_last_reset
  );
END;
$$;

-- Update deduct_credits to also check for daily reset before deducting
CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id uuid, _amount numeric, _transaction_type text, _description text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  credits_record RECORD;
  remaining DECIMAL;
  deducted_daily DECIMAL := 0;
  deducted_bonus DECIMAL := 0;
  deducted_purchased DECIMAL := 0;
  max_daily CONSTANT DECIMAL := 5.0;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get current credits
  SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create new record with daily credits
    INSERT INTO user_credits (user_id, daily_credits, daily_credits_last_reset)
    VALUES (_user_id, max_daily, today);
    SELECT * INTO credits_record FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  END IF;
  
  -- Auto-reset daily credits if it's a new day
  IF credits_record.daily_credits_last_reset IS NULL OR credits_record.daily_credits_last_reset < today THEN
    UPDATE user_credits 
    SET 
      daily_credits = max_daily,
      daily_credits_last_reset = today,
      updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO credits_record;
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

-- Drop the old claim function as it's no longer needed
DROP FUNCTION IF EXISTS public.claim_daily_credits(uuid);
