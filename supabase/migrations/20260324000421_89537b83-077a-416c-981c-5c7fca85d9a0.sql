
-- Tweens table
CREATE TABLE public.tweens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 300),
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  has_poll BOOLEAN DEFAULT false,
  poll_options JSONB,
  poll_ends_at TIMESTAMPTZ,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tween likes
CREATE TABLE public.tween_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tween_id UUID NOT NULL REFERENCES public.tweens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tween_id, user_id)
);

-- Tween comments
CREATE TABLE public.tween_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tween_id UUID NOT NULL REFERENCES public.tweens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.tween_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tween poll votes
CREATE TABLE public.tween_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tween_id UUID NOT NULL REFERENCES public.tweens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tween_id, user_id)
);

-- Comment likes
CREATE TABLE public.tween_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.tween_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX idx_tweens_user_id ON public.tweens(user_id);
CREATE INDEX idx_tweens_created_at ON public.tweens(created_at DESC);
CREATE INDEX idx_tween_likes_tween_id ON public.tween_likes(tween_id);
CREATE INDEX idx_tween_comments_tween_id ON public.tween_comments(tween_id);
CREATE INDEX idx_tween_comments_parent ON public.tween_comments(parent_comment_id);

-- Enable RLS
ALTER TABLE public.tweens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tween_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tween_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tween_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tween_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tweens
CREATE POLICY "Anyone authenticated can read tweens" ON public.tweens FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Users can create tweens" ON public.tweens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tweens" ON public.tweens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tweens" ON public.tweens FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Anyone authenticated can read likes" ON public.tween_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like" ON public.tween_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.tween_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone authenticated can read comments" ON public.tween_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.tween_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.tween_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.tween_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for poll votes
CREATE POLICY "Anyone authenticated can read poll votes" ON public.tween_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can vote" ON public.tween_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for comment likes
CREATE POLICY "Anyone authenticated can read comment likes" ON public.tween_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like comments" ON public.tween_comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.tween_comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update likes_count on tweens
CREATE OR REPLACE FUNCTION public.update_tween_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tweens SET likes_count = likes_count + 1 WHERE id = NEW.tween_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tweens SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.tween_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tween_likes_count_trigger
AFTER INSERT OR DELETE ON public.tween_likes
FOR EACH ROW EXECUTE FUNCTION public.update_tween_likes_count();

-- Trigger to update comments_count on tweens
CREATE OR REPLACE FUNCTION public.update_tween_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tweens SET comments_count = comments_count + 1 WHERE id = NEW.tween_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tweens SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.tween_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tween_comments_count_trigger
AFTER INSERT OR DELETE ON public.tween_comments
FOR EACH ROW EXECUTE FUNCTION public.update_tween_comments_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tweens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tween_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tween_comments;
