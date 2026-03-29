
-- =============================================
-- FIX 1: user_credits - Remove user UPDATE and INSERT policies
-- Credit mutations must go through SECURITY DEFINER functions only
-- =============================================
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;

-- =============================================
-- FIX 2: profiles - Restrict anonymous SELECT to non-PII fields only
-- =============================================
DROP POLICY IF EXISTS "Anonymous can view basic profile info" ON public.profiles;

-- Create a secure function for anonymous profile access (excludes PII)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_region text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  region text,
  bio text,
  is_online boolean,
  last_seen timestamptz,
  age integer,
  sexual_position text,
  looking_for text,
  body_type text,
  height integer,
  weight integer,
  ethnicity text,
  relationship_status text,
  tribes text[],
  is_verified boolean,
  is_premium boolean,
  show_face boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id, p.user_id, p.username, p.avatar_url, p.region, p.bio,
    p.is_online, p.last_seen, p.age, p.sexual_position, p.looking_for,
    p.body_type, p.height, p.weight, p.ethnicity, p.relationship_status,
    p.tribes, p.is_verified, p.is_premium, p.show_face, p.created_at
  FROM public.profiles p
  WHERE (_region IS NULL OR p.region = _region);
$$;

-- Anon can only read non-sensitive fields via RPC above
-- No direct table SELECT for anon
