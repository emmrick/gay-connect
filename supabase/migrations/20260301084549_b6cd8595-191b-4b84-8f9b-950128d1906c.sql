-- Stories table
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  visibility text NOT NULL DEFAULT 'public', -- 'public', 'regional', 'private'
  region_code text, -- for regional visibility
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true
);

-- Story views table
CREATE TABLE public.story_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  screenshot_detected boolean NOT NULL DEFAULT false,
  UNIQUE(story_id, viewer_user_id)
);

-- Storage bucket for stories
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', false);

-- RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories: users can insert their own
CREATE POLICY "Users can insert their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stories: users can delete their own
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Stories: users can update their own
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

-- Stories: complex visibility SELECT policy
CREATE POLICY "Users can view stories based on visibility" ON public.stories
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Own stories
      user_id = auth.uid()
      -- Public stories
      OR visibility = 'public'
      -- Regional stories: viewer must be in the same region
      OR (visibility = 'regional' AND region_code IN (
        SELECT p.region FROM public.profiles p WHERE p.user_id = auth.uid()
      ))
      -- Private stories: viewer must be in sender's favorites
      OR (visibility = 'private' AND EXISTS (
        SELECT 1 FROM public.user_favorites uf
        WHERE uf.user_id = stories.user_id AND uf.favorite_user_id = auth.uid()
      ))
      -- Admins/moderators
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'moderator')
    )
  );

-- Story views: users can insert their own views
CREATE POLICY "Users can insert their own story views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_user_id);

-- Story views: users can view views on their own stories or their own views
CREATE POLICY "Users can view story views" ON public.story_views
  FOR SELECT USING (
    auth.uid() = viewer_user_id
    OR EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
    )
  );

-- Story views: users can update their own views (for screenshot_detected)
CREATE POLICY "Users can update their own story views" ON public.story_views
  FOR UPDATE USING (auth.uid() = viewer_user_id);

-- Storage policies for stories bucket
CREATE POLICY "Users can upload stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view stories media" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own stories media" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;