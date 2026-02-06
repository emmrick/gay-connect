-- Add new task types to the enum
ALTER TYPE public.moderator_task_type ADD VALUE IF NOT EXISTS 'verification_request';
ALTER TYPE public.moderator_task_type ADD VALUE IF NOT EXISTS 'credit_management';

-- Insert new task rates (will be done after enum values are committed)
-- Note: We need to do this in a separate transaction after the enum is updated