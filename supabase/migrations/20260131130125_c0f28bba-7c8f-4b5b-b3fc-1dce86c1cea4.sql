-- Table pour les codes de parrainage de chaque utilisateur
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0
);

-- Table pour suivre les parrainages
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Suivi des paiements consécutifs
  consecutive_payments INTEGER NOT NULL DEFAULT 0,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  -- Statut de la récompense
  referrer_reward_applied BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_applied_at TIMESTAMP WITH TIME ZONE,
  referred_reward_applied BOOLEAN NOT NULL DEFAULT false,
  referred_reward_applied_at TIMESTAMP WITH TIME ZONE,
  -- Statut général
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired'))
);

-- Index pour les recherches
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies pour referral_codes
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
  ON public.referral_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy pour que tout le monde puisse vérifier si un code existe (pour l'inscription)
CREATE POLICY "Anyone can check if a referral code exists"
  ON public.referral_codes
  FOR SELECT
  USING (true);

-- Policies pour referrals
CREATE POLICY "Users can view their own referrals as referrer"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view their own referral as referred"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referred_user_id);

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'GC-';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Fonction pour obtenir ou créer le code de parrainage d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(_user_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_code VARCHAR(20);
  new_code VARCHAR(20);
BEGIN
  -- Check if user already has a code
  SELECT code INTO existing_code FROM public.referral_codes WHERE user_id = _user_id;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := public.generate_referral_code();
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (_user_id, new_code);
  
  RETURN new_code;
END;
$$;

-- Fonction pour enregistrer un parrainage lors de l'inscription
CREATE OR REPLACE FUNCTION public.register_referral(_referred_user_id UUID, _referral_code VARCHAR(20))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referral_code_id UUID;
  _referrer_user_id UUID;
BEGIN
  -- Vérifier que l'utilisateur n'est pas déjà parrainé
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id = _referred_user_id) THEN
    RETURN false;
  END IF;
  
  -- Trouver le code de parrainage
  SELECT id, user_id INTO _referral_code_id, _referrer_user_id
  FROM public.referral_codes
  WHERE code = upper(_referral_code);
  
  IF _referral_code_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Empêcher l'auto-parrainage
  IF _referrer_user_id = _referred_user_id THEN
    RETURN false;
  END IF;
  
  -- Créer le parrainage
  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code_id, status)
  VALUES (_referrer_user_id, _referred_user_id, _referral_code_id, 'pending');
  
  -- Incrémenter le compteur
  UPDATE public.referral_codes
  SET total_referrals = total_referrals + 1
  WHERE id = _referral_code_id;
  
  RETURN true;
END;
$$;

-- Enable realtime for referrals to show updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;