-- Create table for user personal blocks (between users, not admin blocks)
CREATE TABLE public.user_personal_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_personal_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (who they blocked)
CREATE POLICY "Users can view their own blocks"
  ON public.user_personal_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can also see if they are blocked by someone (to prevent messaging)
CREATE POLICY "Users can see if they are blocked"
  ON public.user_personal_blocks
  FOR SELECT
  USING (auth.uid() = blocked_id);

-- Users can create their own blocks
CREATE POLICY "Users can create their own blocks"
  ON public.user_personal_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
  ON public.user_personal_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Create indexes for performance
CREATE INDEX idx_user_personal_blocks_blocker ON public.user_personal_blocks(blocker_id);
CREATE INDEX idx_user_personal_blocks_blocked ON public.user_personal_blocks(blocked_id);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_personal_blocks;