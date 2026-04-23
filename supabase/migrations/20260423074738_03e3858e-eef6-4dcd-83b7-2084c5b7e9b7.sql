-- Table des propositions utilisateurs
CREATE TABLE public.user_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  examples TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | in_review
  admin_notes TEXT,
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_suggestions ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX idx_user_suggestions_user_id ON public.user_suggestions(user_id);
CREATE INDEX idx_user_suggestions_status ON public.user_suggestions(status);
CREATE INDEX idx_user_suggestions_created_at ON public.user_suggestions(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own suggestions"
ON public.user_suggestions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestions"
ON public.user_suggestions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and moderators can view all suggestions"
ON public.user_suggestions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins and moderators can update suggestions"
ON public.user_suggestions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can delete suggestions"
ON public.user_suggestions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_user_suggestions_updated_at
BEFORE UPDATE ON public.user_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction sécurisée : approuver une suggestion + attribuer 30 crédits
CREATE OR REPLACE FUNCTION public.review_suggestion(
  _suggestion_id UUID,
  _new_status TEXT,
  _admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _suggestion RECORD;
  _reviewer_id UUID := auth.uid();
  _credits_to_award INTEGER := 0;
  _credit_result JSONB;
BEGIN
  -- Vérification des droits
  IF NOT (public.has_role(_reviewer_id, 'admin'::app_role) OR public.has_role(_reviewer_id, 'moderator'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  -- Récupérer la suggestion
  SELECT * INTO _suggestion FROM public.user_suggestions WHERE id = _suggestion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Suggestion introuvable');
  END IF;

  -- Validation du statut
  IF _new_status NOT IN ('pending', 'in_review', 'approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Statut invalide');
  END IF;

  -- Si on approuve et qu'aucun crédit n'a encore été attribué : +30 crédits
  IF _new_status = 'approved' AND _suggestion.credits_awarded = 0 THEN
    _credits_to_award := 30;
    SELECT public.add_credits(
      _suggestion.user_id,
      _credits_to_award,
      'bonus'::credit_type,
      'suggestion_approved',
      'Proposition d''amélioration approuvée : ' || _suggestion.title
    ) INTO _credit_result;
  END IF;

  -- Mise à jour de la suggestion
  UPDATE public.user_suggestions
  SET 
    status = _new_status,
    admin_notes = COALESCE(_admin_notes, admin_notes),
    credits_awarded = credits_awarded + _credits_to_award,
    reviewed_by = _reviewer_id,
    reviewed_at = now()
  WHERE id = _suggestion_id;

  RETURN jsonb_build_object(
    'success', true, 
    'credits_awarded', _credits_to_award,
    'new_status', _new_status
  );
END;
$$;