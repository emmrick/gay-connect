-- Dedup/rate-limit log for suggestion decision notifications
CREATE TABLE IF NOT EXISTS public.suggestion_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  channel text NOT NULL, -- 'email' | 'push'
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestion_notif_log_lookup
  ON public.suggestion_notification_log (suggestion_id, channel, sent_at DESC);

-- Prevent duplicate (same suggestion, same status, same channel) ever
CREATE UNIQUE INDEX IF NOT EXISTS uniq_suggestion_notif_log_status
  ON public.suggestion_notification_log (suggestion_id, channel, status);

ALTER TABLE public.suggestion_notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role accesses this table; no policies for end users.
-- (Admins can read via has_role if needed)
CREATE POLICY "Admins can view notif log"
ON public.suggestion_notification_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));