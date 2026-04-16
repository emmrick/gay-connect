-- Function to trigger welcome email backfill (admin only).
-- Iterates over recent profiles missing a 'welcome' email and queues HTTP calls via pg_net.
CREATE OR REPLACE FUNCTION public.backfill_welcome_emails(_days_back integer DEFAULT 60)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _supabase_url text := 'https://vxrsqftlaguiwprcqlbw.supabase.co';
  _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnNxZnRsYWd1aXdwcmNxbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQ1ODgsImV4cCI6MjA4NTIwMDU4OH0.Hcpc4GFLyV3zreSW3hfVzAHaHnMtA9fEivYf2C2MSHc';
  _record record;
  _count integer := 0;
  _request_id bigint;
BEGIN
  -- Only admins can trigger
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  FOR _record IN
    SELECT p.user_id, p.username, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.created_at > NOW() - (_days_back || ' days')::interval
      AND u.email IS NOT NULL
      AND LOWER(u.email) NOT IN (SELECT LOWER(email) FROM public.suppressed_emails)
      AND LOWER(u.email) NOT IN (
        SELECT LOWER(recipient_email) FROM public.email_send_log
        WHERE template_name = 'welcome' AND status = 'sent'
      )
    ORDER BY p.created_at
  LOOP
    SELECT net.http_post(
      url := _supabase_url || '/functions/v1/send-transactional-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key
      ),
      body := jsonb_build_object(
        'templateName', 'welcome',
        'recipientEmail', _record.email,
        'templateData', jsonb_build_object('pseudo', COALESCE(_record.username, 'membre'))
      )
    ) INTO _request_id;
    _count := _count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'queued', _count, 'days_back', _days_back);
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_welcome_emails(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_welcome_emails(integer) TO authenticated;