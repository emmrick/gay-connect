-- Function returning the last successful weekly-digest email sent date
-- for the current authenticated user (looked up by their auth email).
CREATE OR REPLACE FUNCTION public.get_my_last_weekly_digest_sent_at()
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_last  timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT MAX(created_at) INTO v_last
  FROM public.email_send_log
  WHERE template_name = 'weekly-digest'
    AND status = 'sent'
    AND lower(recipient_email) = lower(v_email);

  RETURN v_last;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_last_weekly_digest_sent_at() TO authenticated;