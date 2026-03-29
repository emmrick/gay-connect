
-- =============================================
-- 1. FIX: advertiser_wallets - Remove public SELECT, admin-only + RPC
-- =============================================
DROP POLICY IF EXISTS "Anon can read advertiser wallets for ad serving" ON public.advertiser_wallets;
DROP POLICY IF EXISTS "Authenticated users can read advertiser wallets" ON public.advertiser_wallets;
DROP POLICY IF EXISTS "Anon can create advertiser wallets" ON public.advertiser_wallets;
DROP POLICY IF EXISTS "Authenticated can create advertiser wallets" ON public.advertiser_wallets;

-- RPC to lookup wallet by email (returns limited data, no full exposure)
CREATE OR REPLACE FUNCTION public.get_advertiser_wallet(_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet RECORD;
BEGIN
  SELECT id, advertiser_email, advertiser_name, balance_cents, total_deposited_cents, total_spent_cents, created_at
  INTO _wallet
  FROM public.advertiser_wallets
  WHERE advertiser_email = _email;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', _wallet.id,
    'advertiser_email', _wallet.advertiser_email,
    'advertiser_name', _wallet.advertiser_name,
    'balance_cents', _wallet.balance_cents,
    'total_deposited_cents', _wallet.total_deposited_cents,
    'total_spent_cents', _wallet.total_spent_cents,
    'created_at', _wallet.created_at
  );
END;
$$;

-- =============================================
-- 2. FIX: advertiser_deposits - Remove public SELECT, admin-only
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read deposits" ON public.advertiser_deposits;

-- =============================================
-- 3. FIX: visitor_support_messages - Restrict SELECT to session owner
-- =============================================
DROP POLICY IF EXISTS "Anyone can read visitor messages" ON public.visitor_support_messages;

CREATE POLICY "Session owner can read own messages"
ON public.visitor_support_messages
FOR SELECT
TO anon, authenticated
USING (session_id = session_id);

-- Actually we need a way to filter. Since anon visitors don't have auth, they pass session_id.
-- The RLS can't enforce "you must know the session_id" because SQL doesn't have request context for anon.
-- Best approach: use an RPC to fetch by session_id.
DROP POLICY IF EXISTS "Session owner can read own messages" ON public.visitor_support_messages;

CREATE OR REPLACE FUNCTION public.get_visitor_support_messages(_session_id uuid)
RETURNS SETOF public.visitor_support_messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.visitor_support_messages
  WHERE session_id = _session_id
  ORDER BY created_at ASC;
$$;

-- Only admins/moderators can SELECT directly
CREATE POLICY "Staff can read visitor messages"
ON public.visitor_support_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- =============================================
-- 4. FIX: user_infractions - Remove user INSERT policy
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own infractions" ON public.user_infractions;

-- Only admins/moderators can insert infractions
CREATE POLICY "Staff can insert infractions"
ON public.user_infractions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
