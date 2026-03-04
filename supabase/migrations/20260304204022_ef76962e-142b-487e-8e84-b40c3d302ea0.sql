
-- Security events table for tracking threats, attacks, and vulnerabilities
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- xss_attempt, sql_injection, brute_force, ddos, suspicious_activity, csrf, unauthorized_access, rate_limit_exceeded
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  source_ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  page_url TEXT,
  request_path TEXT,
  description TEXT NOT NULL,
  payload TEXT, -- sanitized suspicious payload for analysis
  metadata JSONB DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_source_ip ON public.security_events(source_ip);
CREATE INDEX idx_security_events_resolved ON public.security_events(is_resolved);

-- Rate limiting table for DDoS protection
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or user_id
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_blocked ON public.rate_limits(is_blocked) WHERE is_blocked = true;

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT security events (anonymous too, for pre-auth attacks)
CREATE POLICY "Anyone can insert security events"
  ON public.security_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins/moderators can read security events
CREATE POLICY "Admins can read security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Only admins can update (resolve) security events
CREATE POLICY "Admins can update security events"
  ON public.security_events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete security events
CREATE POLICY "Admins can delete security events"
  ON public.security_events FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Rate limits: edge functions use service role, but admins can read
CREATE POLICY "Admins can read rate limits"
  ON public.rate_limits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert rate limits"
  ON public.rate_limits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update rate limits"
  ON public.rate_limits FOR UPDATE
  TO anon, authenticated
  USING (true);
