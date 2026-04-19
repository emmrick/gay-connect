-- Fonction pour marquer comme hors ligne les profils dont last_seen est trop ancien (> 5 min)
CREATE OR REPLACE FUNCTION public.cleanup_stale_online_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE public.profiles
  SET is_online = false
  WHERE is_online = true
    AND (last_seen IS NULL OR last_seen < now() - interval '5 minutes');
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- Permettre à tous les utilisateurs (y compris anon) d'appeler la fonction de nettoyage
GRANT EXECUTE ON FUNCTION public.cleanup_stale_online_profiles() TO anon, authenticated;

-- Index pour optimiser la requête de présence en ligne
CREATE INDEX IF NOT EXISTS idx_profiles_online_last_seen 
ON public.profiles (is_online, last_seen) 
WHERE is_online = true;