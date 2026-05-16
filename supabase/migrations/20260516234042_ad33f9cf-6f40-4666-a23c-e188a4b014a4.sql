-- 1. Column
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS always_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ads.always_active IS
  'When true, the ad bypasses automatic deactivation (low wallet balance, budget cap). Toggled by admins/moderators only.';

-- 2. Update impression billing to respect always_active
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(_ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ad RECORD;
  _cost_cents NUMERIC;
  _wallet_balance INTEGER;
BEGIN
  SELECT * INTO _ad FROM public.ads WHERE id = _ad_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF NOT COALESCE(_ad.always_active, false) THEN
    SELECT balance_cents INTO _wallet_balance
    FROM public.advertiser_wallets
    WHERE advertiser_email = _ad.advertiser_email;

    IF COALESCE(_wallet_balance, 0) < 500 THEN
      UPDATE public.ads SET is_active = false, updated_at = now() WHERE id = _ad_id;
      RETURN;
    END IF;
  END IF;

  _cost_cents := COALESCE(_ad.cost_per_mille_cents, 10)::numeric / 1000.0;

  IF _ad.advertiser_email IS NOT NULL THEN
    UPDATE public.advertiser_wallets
    SET balance_cents = GREATEST(0, balance_cents - CEIL(_cost_cents)::integer),
        total_spent_cents = total_spent_cents + CEIL(_cost_cents)::integer,
        updated_at = now()
    WHERE advertiser_email = _ad.advertiser_email
      AND balance_cents > 0;
  END IF;

  UPDATE public.ads
  SET impressions_count = COALESCE(impressions_count, 0) + 1,
      spent_cents = COALESCE(spent_cents, 0) + CEIL(_cost_cents)::integer,
      updated_at = now()
  WHERE id = _ad_id;
END;
$function$;

-- 3. Update click billing to respect always_active
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(_ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ad RECORD;
  _cost INTEGER;
  _wallet_balance INTEGER;
BEGIN
  SELECT * INTO _ad FROM public.ads WHERE id = _ad_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF NOT COALESCE(_ad.always_active, false) THEN
    SELECT balance_cents INTO _wallet_balance
    FROM public.advertiser_wallets
    WHERE advertiser_email = _ad.advertiser_email;

    IF COALESCE(_wallet_balance, 0) < 500 THEN
      UPDATE public.ads SET is_active = false, updated_at = now() WHERE id = _ad_id;
      RETURN;
    END IF;
  END IF;

  _cost := COALESCE(_ad.cost_per_click_cents, 1);

  IF _ad.advertiser_email IS NOT NULL THEN
    UPDATE public.advertiser_wallets
    SET balance_cents = GREATEST(0, balance_cents - _cost),
        total_spent_cents = total_spent_cents + _cost,
        updated_at = now()
    WHERE advertiser_email = _ad.advertiser_email
      AND balance_cents > 0;
  END IF;

  UPDATE public.ads
  SET clicks_count = COALESCE(clicks_count, 0) + 1,
      spent_cents = COALESCE(spent_cents, 0) + _cost,
      updated_at = now()
  WHERE id = _ad_id;
END;
$function$;
