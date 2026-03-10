
-- Flow-based chatbot nodes per user (no AI)
CREATE TABLE public.user_chatbot_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.user_chatbot_nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  response_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_root BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_chatbot_nodes_user ON public.user_chatbot_nodes(user_id);
CREATE INDEX idx_user_chatbot_nodes_parent ON public.user_chatbot_nodes(parent_id);

-- RLS
ALTER TABLE public.user_chatbot_nodes ENABLE ROW LEVEL SECURITY;

-- Public read (visitors can navigate the chatbot tree)
CREATE POLICY "Anyone can read active chatbot nodes"
ON public.user_chatbot_nodes FOR SELECT
USING (is_active = true);

-- Owner can manage their own nodes
CREATE POLICY "Users can insert their own nodes"
ON public.user_chatbot_nodes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nodes"
ON public.user_chatbot_nodes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nodes"
ON public.user_chatbot_nodes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
