-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hide_online_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_last_seen boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.hide_online_status IS 'VIP feature: hide online status indicator';
COMMENT ON COLUMN public.profiles.hide_last_seen IS 'VIP feature: hide last seen timestamp';