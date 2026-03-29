
-- RPC to apply advertiser promo code (handles redemption, wallet bonus, and usage tracking)
CREATE OR REPLACE FUNCTION public.apply_advertiser_promo(
  _code_id uuid,
  _advertiser_email text,
  _bonus_cents integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Record redemption
  INSERT INTO public.advertiser_promo_redemptions (code_id, advertiser_email, bonus_cents_applied)
  VALUES (_code_id, _advertiser_email, _bonus_cents);

  -- Increment times_used
  UPDATE public.advertiser_promo_codes
  SET times_used = times_used + 1
  WHERE id = _code_id;

  -- Add bonus to wallet
  IF _bonus_cents > 0 THEN
    UPDATE public.advertiser_wallets
    SET balance_cents = balance_cents + _bonus_cents,
        updated_at = now()
    WHERE advertiser_email = _advertiser_email;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
