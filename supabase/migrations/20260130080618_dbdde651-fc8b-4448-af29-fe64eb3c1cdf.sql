-- Drop old policy
DROP POLICY IF EXISTS "Users can view album media" ON public.album_media;

-- Create new policy that includes shared albums
CREATE POLICY "Users can view album media" 
ON public.album_media 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_albums a
    WHERE a.id = album_media.album_id 
    AND (
      a.user_id = auth.uid() -- Owner can view
      OR a.is_private = false -- Public albums
      OR EXISTS ( -- User has active share
        SELECT 1 FROM album_shares s
        WHERE s.album_id = a.id
        AND s.shared_with_user_id = auth.uid()
        AND s.is_active = true
        AND (s.expires_at IS NULL OR s.expires_at > now())
      )
    )
  )
);