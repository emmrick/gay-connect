
CREATE TABLE public.chatbot_credit_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credits_given NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_credit_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims"
ON public.chatbot_credit_claims FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
ON public.chatbot_credit_claims FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chatbot_credit_claims_user_id ON public.chatbot_credit_claims(user_id);
