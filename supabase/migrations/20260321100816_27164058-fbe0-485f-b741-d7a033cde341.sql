
-- Advertiser wallets (keyed by email, not user_id since advertisers may not have accounts)
CREATE TABLE public.advertiser_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_email TEXT NOT NULL UNIQUE,
  advertiser_name TEXT NOT NULL DEFAULT '',
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_deposited_cents INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advertiser_wallets ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (for ad serving checks), only admins can modify
CREATE POLICY "Authenticated users can read advertiser wallets"
  ON public.advertiser_wallets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can read advertiser wallets for ad serving"
  ON public.advertiser_wallets FOR SELECT TO anon USING (true);

CREATE POLICY "Admins can manage advertiser wallets"
  ON public.advertiser_wallets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Advertiser wallet deposits (payment history)
CREATE TABLE public.advertiser_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.advertiser_wallets(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'paypal',
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.advertiser_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read deposits"
  ON public.advertiser_deposits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage deposits"
  ON public.advertiser_deposits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anon to insert ads (for the public submission form)
CREATE POLICY "Anyone can submit an ad"
  ON public.ads FOR INSERT TO anon WITH CHECK (status = 'pending' AND is_active = false);

CREATE POLICY "Anyone authenticated can submit an ad"
  ON public.ads FOR INSERT TO authenticated WITH CHECK (status = 'pending' AND is_active = false);

-- Allow anon to insert into advertiser_wallets (auto-created on ad submission)
CREATE POLICY "Anon can create advertiser wallets"
  ON public.advertiser_wallets FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can create advertiser wallets"
  ON public.advertiser_wallets FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anon to insert deposits (for PayPal flow)
CREATE POLICY "Anon can create deposits"
  ON public.advertiser_deposits FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can create deposits"
  ON public.advertiser_deposits FOR INSERT TO authenticated WITH CHECK (true);

-- Update increment functions to deduct from advertiser wallet
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(_ad_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _ad RECORD;
  _cost_cents NUMERIC;
BEGIN
  SELECT * INTO _ad FROM public.ads WHERE id = _ad_id;
  IF NOT FOUND THEN RETURN; END IF;

  _cost_cents := COALESCE(_ad.cost_per_mille_cents, 10)::numeric / 1000.0;

  -- Check advertiser has balance
  IF EXISTS (
    SELECT 1 FROM public.advertiser_wallets
    WHERE advertiser_email = _ad.advertiser_email
      AND balance_cents > 0
  ) THEN
    -- Deduct from wallet
    UPDATE public.advertiser_wallets
    SET balance_cents = GREATEST(0, balance_cents - CEIL(_cost_cents)::integer),
        total_spent_cents = total_spent_cents + CEIL(_cost_cents)::integer,
        updated_at = now()
    WHERE advertiser_email = _ad.advertiser_email;
  END IF;

  UPDATE public.ads
  SET impressions_count = COALESCE(impressions_count, 0) + 1,
      spent_cents = COALESCE(spent_cents, 0) + CEIL(_cost_cents)::integer,
      updated_at = now()
  WHERE id = _ad_id;
END;
$function$;

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

  _cost := COALESCE(_ad.cost_per_click_cents, 2);

  -- Deduct from wallet
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

-- Function to auto-create wallet on ad submission
CREATE OR REPLACE FUNCTION public.auto_create_advertiser_wallet()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.advertiser_wallets (advertiser_email, advertiser_name)
  VALUES (NEW.advertiser_email, NEW.advertiser_name)
  ON CONFLICT (advertiser_email) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_ad_created_create_wallet
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_advertiser_wallet();

-- Updated at trigger
CREATE TRIGGER update_advertiser_wallets_updated_at
  BEFORE UPDATE ON public.advertiser_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
