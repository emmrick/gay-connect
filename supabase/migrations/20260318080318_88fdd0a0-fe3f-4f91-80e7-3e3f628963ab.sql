
-- Create dossier access requests table
CREATE TABLE public.dossier_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  ticket_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  revoked_at timestamptz
);

ALTER TABLE public.dossier_access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: moderators/admins can insert, all involved parties can read
CREATE POLICY "dossier_access_select" ON public.dossier_access_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR target_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "dossier_access_insert" ON public.dossier_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "dossier_access_update" ON public.dossier_access_requests
  FOR UPDATE TO authenticated
  USING (
    target_user_id = auth.uid()
    OR requester_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dossier_access_requests;

-- Auto-revoke dossier access when ticket goes to waiting_client or closed
CREATE OR REPLACE FUNCTION public.revoke_dossier_access_on_ticket_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('waiting_client', 'closed') AND OLD.status NOT IN ('waiting_client', 'closed') THEN
    UPDATE public.dossier_access_requests
    SET status = 'revoked', revoked_at = now()
    WHERE ticket_id = NEW.id AND status = 'approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_status_change_revoke_dossier
  AFTER UPDATE OF status ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_dossier_access_on_ticket_change();
