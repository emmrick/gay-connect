
-- Table for flyer/credit promo codes
CREATE TABLE public.flyer_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  credits_amount NUMERIC NOT NULL DEFAULT 30.0,
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to track which user redeemed which code
CREATE TABLE public.flyer_promo_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL REFERENCES public.flyer_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credits_given NUMERIC NOT NULL,
  UNIQUE(code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.flyer_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flyer_promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can manage flyer codes
CREATE POLICY "Admins can manage flyer promo codes"
ON public.flyer_promo_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can read active codes (needed for validation)
CREATE POLICY "Users can read active flyer codes"
ON public.flyer_promo_codes
FOR SELECT
TO authenticated
USING (is_active = true);

-- Users can see their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.flyer_promo_redemptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own redemption
CREATE POLICY "Users can redeem codes"
ON public.flyer_promo_redemptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
ON public.flyer_promo_redemptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to redeem a flyer promo code
CREATE OR REPLACE FUNCTION public.redeem_flyer_promo_code(_user_id UUID, _code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _promo RECORD;
BEGIN
  -- Find the code
  SELECT * INTO _promo
  FROM public.flyer_promo_codes
  WHERE code = upper(_code)
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Code promo invalide ou inactif');
  END IF;

  -- Check expiration
  IF _promo.expires_at IS NOT NULL AND _promo.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Ce code promo a expiré');
  END IF;

  -- Check max uses
  IF _promo.max_uses IS NOT NULL AND _promo.times_used >= _promo.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Ce code promo a atteint sa limite d''utilisation');
  END IF;

  -- Check if user already used this code
  IF EXISTS (SELECT 1 FROM public.flyer_promo_redemptions WHERE code_id = _promo.id AND user_id = _user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Tu as déjà utilisé ce code promo');
  END IF;

  -- Record redemption
  INSERT INTO public.flyer_promo_redemptions (code_id, user_id, credits_given)
  VALUES (_promo.id, _user_id, _promo.credits_amount);

  -- Increment usage count
  UPDATE public.flyer_promo_codes SET times_used = times_used + 1 WHERE id = _promo.id;

  -- Add credits to user
  PERFORM public.add_credits(_user_id, _promo.credits_amount, 'bonus', 'flyer_promo', 'Code promo flyer: ' || _promo.code);

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (_user_id, 'promo_credits', '🎁 Crédits offerts !', 'Tu as reçu ' || _promo.credits_amount || ' crédits grâce au code ' || _promo.code || ' !', false);

  RETURN json_build_object('success', true, 'credits', _promo.credits_amount, 'code', _promo.code);
END;
$$;
