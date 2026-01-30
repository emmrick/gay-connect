-- Add read_at column to track when each message was read
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of unread messages
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(recipient_id, read_at) 
WHERE is_private = true AND read_at IS NULL;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  _user_id UUID,
  _sender_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE recipient_id = _user_id
    AND sender_id = _sender_id
    AND is_private = true
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;