-- Add first_verified_at to track if user was ever verified (protects from 30-day purge on re-verification)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_verified_at timestamptz DEFAULT NULL;

-- Backfill: set first_verified_at for all currently verified users
UPDATE public.profiles 
SET first_verified_at = COALESCE(
  (SELECT MIN(reviewed_at) FROM public.identity_verifications iv WHERE iv.user_id = profiles.user_id AND iv.status = 'approved'),
  now()
)
WHERE is_verified = true AND first_verified_at IS NULL;

-- Create trigger to auto-set first_verified_at when verification is first approved
CREATE OR REPLACE FUNCTION public.set_first_verified_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET first_verified_at = COALESCE(first_verified_at, now())
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_first_verified_at ON public.identity_verifications;
CREATE TRIGGER trg_set_first_verified_at
  AFTER UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_first_verified_at();