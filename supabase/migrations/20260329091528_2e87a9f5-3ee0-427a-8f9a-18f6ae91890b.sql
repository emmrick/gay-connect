
-- RPC for toggling credit locks (user can only toggle their own locks)
CREATE OR REPLACE FUNCTION public.toggle_credit_lock(
  _lock_type text,
  _value boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _lock_type NOT IN ('lock_passive', 'lock_bonus', 'lock_purchased') THEN
    RAISE EXCEPTION 'Invalid lock type';
  END IF;

  EXECUTE format('UPDATE public.user_credits SET %I = $1, updated_at = now() WHERE user_id = $2', _lock_type)
  USING _value, auth.uid();
END;
$$;
