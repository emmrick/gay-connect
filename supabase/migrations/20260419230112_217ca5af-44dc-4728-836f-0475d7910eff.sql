-- Ajout d'une référence mensuelle pour la barre de progression des crédits
-- monthly_reference_balance : snapshot du solde au 1er du mois (sert de "max" à la barre)
-- monthly_reference_date    : date du dernier snapshot (pour détecter le changement de mois)
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS monthly_reference_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_reference_date date NOT NULL DEFAULT (date_trunc('month', now()))::date;

-- Initialiser la référence avec le solde actuel pour les comptes existants
UPDATE public.user_credits
SET monthly_reference_balance = GREATEST(
  COALESCE(daily_credits,0) + COALESCE(passive_credits,0) + COALESCE(bonus_credits,0) + COALESCE(purchased_credits,0),
  COALESCE(monthly_reference_balance,0)
)
WHERE monthly_reference_balance = 0;

-- Fonction RPC : assure que la référence est à jour (réinitialisation au 1er du mois,
-- ou montée si le solde dépasse la référence). Retourne la référence courante.
CREATE OR REPLACE FUNCTION public.refresh_monthly_credit_reference(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_ref numeric;
  v_ref_date date;
  v_current_month date := (date_trunc('month', now()))::date;
BEGIN
  SELECT
    COALESCE(daily_credits,0) + COALESCE(passive_credits,0) + COALESCE(bonus_credits,0) + COALESCE(purchased_credits,0),
    COALESCE(monthly_reference_balance,0),
    monthly_reference_date
  INTO v_total, v_ref, v_ref_date
  FROM public.user_credits
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Nouveau mois : snapshot = solde actuel
  IF v_ref_date IS NULL OR v_ref_date < v_current_month THEN
    UPDATE public.user_credits
    SET monthly_reference_balance = v_total,
        monthly_reference_date = v_current_month,
        updated_at = now()
    WHERE user_id = _user_id;
    RETURN v_total;
  END IF;

  -- Solde dépasse la référence : on monte la référence
  IF v_total > v_ref THEN
    UPDATE public.user_credits
    SET monthly_reference_balance = v_total,
        updated_at = now()
    WHERE user_id = _user_id;
    RETURN v_total;
  END IF;

  RETURN v_ref;
END;
$$;