-- Add notification_sound column to store user's preferred sound
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default';

-- Add comment
COMMENT ON COLUMN public.notification_preferences.notification_sound IS 'User preferred notification sound: default, soft, chime, pop, bell, none';