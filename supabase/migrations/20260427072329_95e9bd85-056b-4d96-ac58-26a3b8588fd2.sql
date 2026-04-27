
-- Magic links table for advertiser authentication
CREATE TABLE IF NOT EXISTS public.advertiser_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_adv_magic_links_token ON public.advertiser_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_adv_magic_links_email ON public.advertiser_magic_links(advertiser_email, created_at DESC);

ALTER TABLE public.advertiser_magic_links ENABLE ROW LEVEL SECURITY;

-- No one can read/write directly. Only via SECURITY DEFINER RPCs.
CREATE POLICY "Admins can read magic links"
  ON public.advertiser_magic_links FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Generate token (rate-limited to 5/h)
CREATE OR REPLACE FUNCTION public.request_advertiser_magic_link(_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INT;
  v_token TEXT;
  v_normalized TEXT;
BEGIN
  v_normalized := lower(trim(_email));
  IF v_normalized IS NULL OR v_normalized !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  SELECT COUNT(*) INTO v_recent_count
  FROM public.advertiser_magic_links
  WHERE advertiser_email = v_normalized
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.advertiser_magic_links (advertiser_email, token, expires_at)
  VALUES (v_normalized, v_token, now() + interval '15 minutes');

  RETURN v_token;
END;
$$;

-- Consume token: returns the email if valid, NULL otherwise
CREATE OR REPLACE FUNCTION public.consume_advertiser_magic_link(_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_id UUID;
BEGIN
  SELECT id, advertiser_email INTO v_id, v_email
  FROM public.advertiser_magic_links
  WHERE token = _token
    AND used_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.advertiser_magic_links
  SET used_at = now()
  WHERE id = v_id;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_advertiser_magic_link(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_advertiser_magic_link(TEXT) TO anon, authenticated;
