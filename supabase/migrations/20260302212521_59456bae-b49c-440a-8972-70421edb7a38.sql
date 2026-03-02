
-- Add faq_article_id to help_chatbot_nodes to link a chatbot node to a FAQ article
ALTER TABLE public.help_chatbot_nodes 
ADD COLUMN faq_article_id uuid REFERENCES public.faq_articles(id) ON DELETE SET NULL;
