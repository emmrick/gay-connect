CREATE TABLE public.beta_interest_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  donation_amount NUMERIC(6,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_interest_submissions TO authenticated;
GRANT ALL ON public.beta_interest_submissions TO service_role;

ALTER TABLE public.beta_interest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view beta interest submissions"
ON public.beta_interest_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can update beta interest submissions"
ON public.beta_interest_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));