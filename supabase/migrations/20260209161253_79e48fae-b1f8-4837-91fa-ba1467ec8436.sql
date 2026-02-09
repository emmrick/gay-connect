
-- Table for storing moderator permissions
CREATE TABLE public.moderator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- What sections/actions they can access
  can_manage_reports BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_credits BOOLEAN DEFAULT false,
  can_verify_identity BOOLEAN DEFAULT false,
  can_manage_content BOOLEAN DEFAULT false,
  can_view_stats BOOLEAN DEFAULT false,
  can_manage_blocked BOOLEAN DEFAULT false,
  can_view_history BOOLEAN DEFAULT false,
  can_manage_promo BOOLEAN DEFAULT false,
  can_broadcast BOOLEAN DEFAULT false,
  can_ai_moderation BOOLEAN DEFAULT false,
  can_screenshot_sanctions BOOLEAN DEFAULT false,
  -- Metadata
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage moderator permissions
CREATE POLICY "Admins can manage moderator permissions"
ON public.moderator_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Moderators can read their own permissions
CREATE POLICY "Moderators can view own permissions"
ON public.moderator_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to promote user to moderator with permissions
CREATE OR REPLACE FUNCTION public.promote_to_moderator(
  _target_user_id UUID,
  _permissions JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID := auth.uid();
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Add moderator role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'moderator')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Set permissions
  INSERT INTO public.moderator_permissions (
    user_id, assigned_by,
    can_manage_reports, can_manage_users, can_manage_credits,
    can_verify_identity, can_manage_content, can_view_stats,
    can_manage_blocked, can_view_history, can_manage_promo,
    can_broadcast, can_ai_moderation, can_screenshot_sanctions
  ) VALUES (
    _target_user_id, _admin_id,
    COALESCE((_permissions->>'can_manage_reports')::boolean, false),
    COALESCE((_permissions->>'can_manage_users')::boolean, false),
    COALESCE((_permissions->>'can_manage_credits')::boolean, false),
    COALESCE((_permissions->>'can_verify_identity')::boolean, false),
    COALESCE((_permissions->>'can_manage_content')::boolean, false),
    COALESCE((_permissions->>'can_view_stats')::boolean, false),
    COALESCE((_permissions->>'can_manage_blocked')::boolean, false),
    COALESCE((_permissions->>'can_view_history')::boolean, false),
    COALESCE((_permissions->>'can_manage_promo')::boolean, false),
    COALESCE((_permissions->>'can_broadcast')::boolean, false),
    COALESCE((_permissions->>'can_ai_moderation')::boolean, false),
    COALESCE((_permissions->>'can_screenshot_sanctions')::boolean, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    can_manage_reports = COALESCE((_permissions->>'can_manage_reports')::boolean, moderator_permissions.can_manage_reports),
    can_manage_users = COALESCE((_permissions->>'can_manage_users')::boolean, moderator_permissions.can_manage_users),
    can_manage_credits = COALESCE((_permissions->>'can_manage_credits')::boolean, moderator_permissions.can_manage_credits),
    can_verify_identity = COALESCE((_permissions->>'can_verify_identity')::boolean, moderator_permissions.can_verify_identity),
    can_manage_content = COALESCE((_permissions->>'can_manage_content')::boolean, moderator_permissions.can_manage_content),
    can_view_stats = COALESCE((_permissions->>'can_view_stats')::boolean, moderator_permissions.can_view_stats),
    can_manage_blocked = COALESCE((_permissions->>'can_manage_blocked')::boolean, moderator_permissions.can_manage_blocked),
    can_view_history = COALESCE((_permissions->>'can_view_history')::boolean, moderator_permissions.can_view_history),
    can_manage_promo = COALESCE((_permissions->>'can_manage_promo')::boolean, moderator_permissions.can_manage_promo),
    can_broadcast = COALESCE((_permissions->>'can_broadcast')::boolean, moderator_permissions.can_broadcast),
    can_ai_moderation = COALESCE((_permissions->>'can_ai_moderation')::boolean, moderator_permissions.can_ai_moderation),
    can_screenshot_sanctions = COALESCE((_permissions->>'can_screenshot_sanctions')::boolean, moderator_permissions.can_screenshot_sanctions),
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to demote moderator
CREATE OR REPLACE FUNCTION public.demote_moderator(_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID := auth.uid();
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = 'moderator';
  DELETE FROM public.moderator_permissions WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_moderator_permissions_updated_at
BEFORE UPDATE ON public.moderator_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
