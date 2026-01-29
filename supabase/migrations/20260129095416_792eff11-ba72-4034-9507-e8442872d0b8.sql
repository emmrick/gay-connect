-- Table pour suivre l'utilisation des fonctionnalités
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ephemeral_media_count INTEGER NOT NULL DEFAULT 0,
  ephemeral_media_last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  profile_photos_viewed INTEGER NOT NULL DEFAULT 0,
  profile_photos_last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  nearby_profiles_viewed INTEGER NOT NULL DEFAULT 0,
  nearby_profiles_last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  conversations_started INTEGER NOT NULL DEFAULT 0,
  conversations_last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  albums_count INTEGER NOT NULL DEFAULT 0,
  saved_messages_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.user_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own usage"
ON public.user_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own usage"
ON public.user_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Table pour les albums de contenu
CREATE TABLE public.user_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_albums ENABLE ROW LEVEL SECURITY;

-- Users can view their own albums
CREATE POLICY "Users can view their own albums"
ON public.user_albums
FOR SELECT
USING (auth.uid() = user_id OR is_private = false);

-- Users can insert their own albums
CREATE POLICY "Users can insert their own albums"
ON public.user_albums
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own albums
CREATE POLICY "Users can update their own albums"
ON public.user_albums
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own albums
CREATE POLICY "Users can delete their own albums"
ON public.user_albums
FOR DELETE
USING (auth.uid() = user_id);

-- Table pour les médias dans les albums
CREATE TABLE public.album_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.user_albums(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.album_media ENABLE ROW LEVEL SECURITY;

-- Users can view media in albums they can see
CREATE POLICY "Users can view album media"
ON public.album_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_albums a 
    WHERE a.id = album_media.album_id 
    AND (a.user_id = auth.uid() OR a.is_private = false)
  )
);

-- Users can insert media in their albums
CREATE POLICY "Users can insert album media"
ON public.album_media
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_albums a 
    WHERE a.id = album_media.album_id 
    AND a.user_id = auth.uid()
  )
);

-- Users can delete their own media
CREATE POLICY "Users can delete their album media"
ON public.album_media
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_albums a 
    WHERE a.id = album_media.album_id 
    AND a.user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_albums_updated_at
BEFORE UPDATE ON public.user_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();