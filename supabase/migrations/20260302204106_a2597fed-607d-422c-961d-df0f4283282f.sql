
-- Table for FAQ articles managed by admin
CREATE TABLE public.faq_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published FAQ articles
CREATE POLICY "Anyone can view published FAQ" ON public.faq_articles
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can insert FAQ" ON public.faq_articles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update FAQ" ON public.faq_articles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete FAQ" ON public.faq_articles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for chatbot pre-written Q&A flows managed by admin
CREATE TABLE public.help_chatbot_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.help_chatbot_nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  response_text TEXT,
  is_root BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.help_chatbot_nodes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active nodes
CREATE POLICY "Authenticated users can view active nodes" ON public.help_chatbot_nodes
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert nodes" ON public.help_chatbot_nodes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update nodes" ON public.help_chatbot_nodes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete nodes" ON public.help_chatbot_nodes
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_faq_articles_updated_at
  BEFORE UPDATE ON public.faq_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_chatbot_nodes_updated_at
  BEFORE UPDATE ON public.help_chatbot_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
