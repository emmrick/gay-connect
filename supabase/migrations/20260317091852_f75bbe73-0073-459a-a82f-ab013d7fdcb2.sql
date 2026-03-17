
-- Table pour les demandes de suppression de compte avec délai de 30 jours
CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own deletion request
CREATE POLICY "Users can view their own deletion request"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own deletion request
CREATE POLICY "Users can create their own deletion request"
ON public.account_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update (cancel) their own deletion request
CREATE POLICY "Users can update their own deletion request"
ON public.account_deletion_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all deletion requests
CREATE POLICY "Admins can update all deletion requests"
ON public.account_deletion_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to cancel deletion on login
CREATE OR REPLACE FUNCTION public.cancel_deletion_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user updates their last_seen (login), cancel any pending deletion
  IF NEW.last_seen IS DISTINCT FROM OLD.last_seen THEN
    UPDATE public.account_deletion_requests
    SET status = 'cancelled',
        cancelled_at = now(),
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on profiles to detect login (last_seen update)
CREATE TRIGGER cancel_deletion_on_profile_activity
AFTER UPDATE OF last_seen ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.cancel_deletion_on_login();
