-- New SECURITY DEFINER RPC to fetch map coordinates for a list of visible profiles.
-- Excludes blocked, suspended and currently-hidden users, and respects basic visibility rules.
CREATE OR REPLACE FUNCTION public.get_profile_map_coords(_user_ids uuid[])
RETURNS TABLE(user_id uuid, latitude double precision, longitude double precision)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.latitude, p.longitude
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.user_id <> auth.uid()
    AND NOT public.is_user_blocked(p.user_id)
    AND NOT public.is_user_suspended(p.user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.location_hide_periods lhp
      WHERE lhp.user_id = p.user_id
        AND lhp.is_currently_hidden = true
        AND lhp.expires_at > now()
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_profile_map_coords(uuid[]) TO authenticated;
