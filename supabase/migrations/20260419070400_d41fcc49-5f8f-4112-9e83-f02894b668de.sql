
-- Function to purge unread ephemeral media older than 7 days
CREATE OR REPLACE FUNCTION public.purge_old_unread_ephemeral_media()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.ephemeral_media
    WHERE is_viewed = false
      AND view_duration <> 0  -- exclude unlimited
      AND screenshot_detected = false
      AND created_at < (now() - interval '7 days')
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Schedule hourly execution (drop existing job if any to be idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-old-unread-ephemeral-media') THEN
    PERFORM cron.unschedule('purge-old-unread-ephemeral-media');
  END IF;

  PERFORM cron.schedule(
    'purge-old-unread-ephemeral-media',
    '0 * * * *',
    $cron$ SELECT public.purge_old_unread_ephemeral_media(); $cron$
  );
END;
$$;
