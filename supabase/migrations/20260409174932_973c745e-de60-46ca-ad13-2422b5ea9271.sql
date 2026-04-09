
-- Couple accounts table
CREATE TABLE public.couple_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  partner_user_id UUID,
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_conversations BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id),
  UNIQUE(invite_code)
);

ALTER TABLE public.couple_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their couple account"
ON public.couple_accounts FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Owner can update couple account"
ON public.couple_accounts FOR UPDATE TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Authenticated users can create couple accounts"
ON public.couple_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can delete couple account"
ON public.couple_accounts FOR DELETE TO authenticated
USING (auth.uid() = owner_user_id);

-- Couple invitations table
CREATE TABLE public.couple_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL,
  invitee_email TEXT,
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  couple_account_id UUID NOT NULL REFERENCES public.couple_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token)
);

ALTER TABLE public.couple_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter can manage invitations"
ON public.couple_invitations FOR ALL TO authenticated
USING (auth.uid() = inviter_user_id)
WITH CHECK (auth.uid() = inviter_user_id);

-- Anyone can read invitation by token (for accepting)
CREATE POLICY "Anyone can read invitation by token"
ON public.couple_invitations FOR SELECT TO authenticated
USING (true);

-- Couple activity log
CREATE TABLE public.couple_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_account_id UUID NOT NULL REFERENCES public.couple_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view activity log"
ON public.couple_activity_log FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.couple_accounts ca
    WHERE ca.id = couple_account_id
    AND (ca.owner_user_id = auth.uid() OR ca.partner_user_id = auth.uid())
  )
);

CREATE POLICY "System can insert activity log"
ON public.couple_activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add couple fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS couple_account_id UUID REFERENCES public.couple_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS couple_role TEXT DEFAULT NULL;

-- Triggers for updated_at
CREATE TRIGGER update_couple_accounts_updated_at
BEFORE UPDATE ON public.couple_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to join a couple via invite code
CREATE OR REPLACE FUNCTION public.join_couple_by_code(_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _couple RECORD;
  _user_id UUID := auth.uid();
BEGIN
  -- Find couple account by invite code
  SELECT * INTO _couple FROM public.couple_accounts
  WHERE invite_code = _invite_code AND status = 'pending' AND partner_user_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code invalide ou déjà utilisé');
  END IF;

  IF _couple.owner_user_id = _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas rejoindre votre propre compte');
  END IF;

  -- Check user is not already in a couple
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND couple_account_id IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous faites déjà partie d''un couple');
  END IF;

  -- Update couple account
  UPDATE public.couple_accounts
  SET partner_user_id = _user_id, status = 'active', updated_at = now()
  WHERE id = _couple.id;

  -- Update partner profile
  UPDATE public.profiles
  SET couple_account_id = _couple.id, couple_role = 'partner'
  WHERE user_id = _user_id;

  -- Update any pending invitations
  UPDATE public.couple_invitations
  SET status = 'accepted'
  WHERE couple_account_id = _couple.id AND status = 'pending';

  -- Log activity
  INSERT INTO public.couple_activity_log (couple_account_id, user_id, action, description)
  VALUES (_couple.id, _user_id, 'partner_joined', 'Partenaire a rejoint le couple');

  -- Notify owner
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (
    _couple.owner_user_id,
    'couple_joined',
    '💕 Votre partenaire a rejoint le compte !',
    'Votre partenaire a accepté l''invitation et fait maintenant partie de votre compte couple.',
    false
  );

  RETURN jsonb_build_object('success', true, 'couple_account_id', _couple.id);
END;
$$;

-- RPC to dissolve a couple
CREATE OR REPLACE FUNCTION public.dissolve_couple(_couple_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _couple RECORD;
  _user_id UUID := auth.uid();
  _other_user_id UUID;
BEGIN
  SELECT * INTO _couple FROM public.couple_accounts WHERE id = _couple_account_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte couple introuvable');
  END IF;

  IF _couple.owner_user_id != _user_id AND _couple.partner_user_id != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Determine the other user
  _other_user_id := CASE WHEN _couple.owner_user_id = _user_id THEN _couple.partner_user_id ELSE _couple.owner_user_id END;

  -- Remove couple from both profiles
  UPDATE public.profiles SET couple_account_id = NULL, couple_role = NULL
  WHERE couple_account_id = _couple_account_id;

  -- Mark as dissolved
  UPDATE public.couple_accounts SET status = 'dissolved', updated_at = now()
  WHERE id = _couple_account_id;

  -- Log
  INSERT INTO public.couple_activity_log (couple_account_id, user_id, action, description)
  VALUES (_couple_account_id, _user_id, 'couple_dissolved', 'Le couple a été dissous');

  -- Notify other user
  IF _other_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, is_read)
    VALUES (
      _other_user_id,
      'couple_dissolved',
      '💔 Compte couple dissous',
      'Votre partenaire a dissous le compte couple. Vos profils sont maintenant indépendants.',
      false
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
