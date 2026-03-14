
-- Function to check if a user is currently suspended or banned
CREATE OR REPLACE FUNCTION public.is_user_suspended_or_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE user_id = _user_id
      AND is_active = true
      AND (
        suspension_type = 'permanent'
        OR (suspension_type = 'temporary' AND (suspension_ends_at IS NULL OR suspension_ends_at > now()))
      )
  )
$$;
