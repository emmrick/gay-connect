-- Update RLS policy to allow recipients to see shares even when inactive
-- This allows them to see "Partage arrêté" message instead of nothing

DROP POLICY IF EXISTS "Users can view shares they received" ON public.album_shares;

CREATE POLICY "Users can view shares they received"
ON public.album_shares
FOR SELECT
USING (shared_with_user_id = auth.uid());

-- Note: The album_media RLS already prevents access to media when share is inactive
-- because it checks: s.is_active = true AND (s.expires_at IS NULL OR s.expires_at > now())