-- Add reply_to_id column to messages table for reply functionality
ALTER TABLE public.messages 
ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);

-- Create typing_indicators table for real-time typing status
CREATE TABLE public.typing_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(chat_room_id, user_id)
);

-- Enable RLS on typing_indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing_indicators
CREATE POLICY "Anyone can view typing indicators in public rooms"
ON public.typing_indicators
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own typing indicator"
ON public.typing_indicators
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing indicator"
ON public.typing_indicators
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicator"
ON public.typing_indicators
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;