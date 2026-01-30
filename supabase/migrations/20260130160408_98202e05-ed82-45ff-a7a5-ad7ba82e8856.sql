-- Create a table to track user-specific conversation status (archived/deleted)
CREATE TABLE public.private_conversation_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.private_conversation_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversation statuses
CREATE POLICY "Users can view their own conversation status"
ON public.private_conversation_status
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own conversation status
CREATE POLICY "Users can insert their own conversation status"
ON public.private_conversation_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversation status
CREATE POLICY "Users can update their own conversation status"
ON public.private_conversation_status
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own conversation status
CREATE POLICY "Users can delete their own conversation status"
ON public.private_conversation_status
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_private_conversation_status_updated_at
BEFORE UPDATE ON public.private_conversation_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();