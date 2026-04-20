
-- 1. Table de suivi
CREATE TABLE IF NOT EXISTS public.tween_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tween_follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT tween_follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_tween_follows_follower ON public.tween_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_tween_follows_following ON public.tween_follows(following_id);

ALTER TABLE public.tween_follows ENABLE ROW LEVEL SECURITY;

-- 2. RLS policies
DROP POLICY IF EXISTS "Anyone can view tween follows" ON public.tween_follows;
CREATE POLICY "Anyone can view tween follows"
  ON public.tween_follows
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.tween_follows;
CREATE POLICY "Users can follow others"
  ON public.tween_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.tween_follows;
CREATE POLICY "Users can unfollow"
  ON public.tween_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- 3. Trigger : notifier les abonnés à chaque nouveau Tween
CREATE OR REPLACE FUNCTION public.notify_tween_followers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_username text;
BEGIN
  IF NEW.is_deleted = true THEN
    RETURN NEW;
  END IF;

  SELECT username INTO v_author_username
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, action_url)
  SELECT
    f.follower_id,
    'tween_new_post',
    'Nouveau Tween de ' || COALESCE(v_author_username, 'un membre suivi'),
    COALESCE(LEFT(NEW.content, 120), 'A publié un nouveau contenu'),
    '/tween'
  FROM public.tween_follows f
  WHERE f.following_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tween_followers ON public.tweens;
CREATE TRIGGER trg_notify_tween_followers
  AFTER INSERT ON public.tweens
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tween_followers();

-- 4. Permettre au trigger SECURITY DEFINER d'insérer dans notifications pour les abonnés
DROP POLICY IF EXISTS "System can insert tween notifications" ON public.notifications;
CREATE POLICY "System can insert tween notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (type IN ('tween_new_post', 'tween_like', 'tween_comment'));
