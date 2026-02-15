
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS push_matches boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS push_mentions boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS push_credits boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS push_verification boolean NOT NULL DEFAULT true;
