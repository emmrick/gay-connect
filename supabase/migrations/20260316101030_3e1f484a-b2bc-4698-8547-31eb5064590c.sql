-- Function to deactivate expired temporary suspensions
CREATE OR REPLACE FUNCTION public.cleanup_expired_suspensions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.user_blocks
  SET is_active = false,
      unblocked_at = now()
  WHERE is_active = true
    AND suspension_type = 'temporary'
    AND suspension_ends_at IS NOT NULL
    AND suspension_ends_at <= now();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;