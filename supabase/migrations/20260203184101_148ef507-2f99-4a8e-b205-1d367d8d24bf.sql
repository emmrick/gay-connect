-- Create table for group mute preferences
CREATE TABLE public.group_mute_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  region_code TEXT NOT NULL,
  is_muted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, region_code)
);

-- Enable RLS
ALTER TABLE public.group_mute_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own mute preferences
CREATE POLICY "Users can view their own mute preferences"
ON public.group_mute_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own mute preferences
CREATE POLICY "Users can insert their own mute preferences"
ON public.group_mute_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own mute preferences
CREATE POLICY "Users can update their own mute preferences"
ON public.group_mute_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own mute preferences
CREATE POLICY "Users can delete their own mute preferences"
ON public.group_mute_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_group_mute_preferences_updated_at
BEFORE UPDATE ON public.group_mute_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();