
-- Update default CPC to 1 cent (0.01€) and CPM to 10 cents per 1000 (0.01€ per 100)
ALTER TABLE public.ads ALTER COLUMN cost_per_click_cents SET DEFAULT 1;
ALTER TABLE public.ads ALTER COLUMN cost_per_mille_cents SET DEFAULT 10;

-- Update the increment_ad_clicks function to use 1 cent default
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(_ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ad RECORD;
  _cost INTEGER;
BEGIN
  SELECT * INTO _ad FROM public.ads WHERE id = _ad_id;
  IF NOT FOUND THEN RETURN; END IF;

  _cost := COALESCE(_ad.cost_per_click_cents, 1);

  IF EXISTS (
    SELECT 1 FROM public.advertiser_wallets
    WHERE advertiser_email = _ad.advertiser_email
      AND balance_cents > 0
  ) THEN
    UPDATE public.advertiser_wallets
    SET balance_cents = GREATEST(0, balance_cents - _cost),
        total_spent_cents = total_spent_cents + _cost,
        updated_at = now()
    WHERE advertiser_email = _ad.advertiser_email;
  END IF;

  UPDATE public.ads
  SET clicks_count = COALESCE(clicks_count, 0) + 1,
      spent_cents = COALESCE(spent_cents, 0) + _cost,
      updated_at = now()
  WHERE id = _ad_id;
END;
$function$;

-- Add geographic targeting columns
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS geo_targeting text NOT NULL DEFAULT 'national';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS geo_postal_codes text[] DEFAULT '{}';
