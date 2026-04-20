
CREATE TABLE IF NOT EXISTS public.tween_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tween_id uuid NOT NULL REFERENCES public.tweens(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tween_favorites_unique UNIQUE (user_id, tween_id)
);

CREATE INDEX IF NOT EXISTS idx_tween_favorites_user ON public.tween_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tween_favorites_tween ON public.tween_favorites(tween_id);

ALTER TABLE public.tween_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tween favorites" ON public.tween_favorites;
CREATE POLICY "Users can view their tween favorites"
  ON public.tween_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add tween favorites" ON public.tween_favorites;
CREATE POLICY "Users can add tween favorites"
  ON public.tween_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove tween favorites" ON public.tween_favorites;
CREATE POLICY "Users can remove tween favorites"
  ON public.tween_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
