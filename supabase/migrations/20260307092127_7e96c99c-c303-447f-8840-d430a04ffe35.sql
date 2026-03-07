
-- Add is_announcement column to chat_rooms
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS is_announcement boolean DEFAULT false;

-- Create the announcement channel
INSERT INTO public.chat_rooms (region_code, region_name, is_custom, is_announcement, custom_name, description)
VALUES ('announcement', 'Canal Informations', false, true, 'Canal Informations', 'Canal officiel d''informations. Seuls les administrateurs peuvent publier.')
ON CONFLICT DO NOTHING;

-- Everyone should be able to read announcement messages (no membership required)
-- RLS already allows reading chat_rooms publicly
