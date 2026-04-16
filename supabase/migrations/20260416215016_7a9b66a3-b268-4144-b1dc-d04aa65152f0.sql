CREATE OR REPLACE FUNCTION public.get_community_public_stats()
RETURNS TABLE (
  total_members bigint,
  online_members bigint,
  verified_members bigint,
  total_rooms bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles)::bigint,
    (SELECT COUNT(*) FROM public.profiles
       WHERE is_online = true
         AND last_seen >= now() - interval '5 minutes')::bigint,
    (SELECT COUNT(*) FROM public.identity_verifications WHERE status = 'approved')::bigint,
    (SELECT COUNT(*) FROM public.chat_rooms)::bigint;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_public_stats() TO anon, authenticated;