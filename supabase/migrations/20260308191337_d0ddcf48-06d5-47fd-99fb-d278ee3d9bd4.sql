
ALTER TABLE public.private_conversation_status
ADD COLUMN auto_delete_mode text NOT NULL DEFAULT 'never',
ADD COLUMN messages_hidden_before timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.private_conversation_status.auto_delete_mode IS 'Auto-delete mode: never, immediate, 24h, 7d, 30d, 90d';
COMMENT ON COLUMN public.private_conversation_status.messages_hidden_before IS 'Messages before this timestamp are hidden for this user (soft delete, preserved for admin)';
