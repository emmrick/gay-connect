-- Fonction pour incrémenter le compteur de parrainages réussis
CREATE OR REPLACE FUNCTION public.update_successful_referrals(_referral_code_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.referral_codes
  SET successful_referrals = successful_referrals + 1
  WHERE id = _referral_code_id;
END;
$$;