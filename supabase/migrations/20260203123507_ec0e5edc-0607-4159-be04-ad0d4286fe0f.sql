-- Create credit purchase requests table
CREATE TABLE public.credit_purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  price_euros NUMERIC NOT NULL CHECK (price_euros > 0),
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_purchase_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own purchase requests"
ON public.credit_purchase_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create purchase requests"
ON public.credit_purchase_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all purchase requests"
ON public.credit_purchase_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update purchase requests"
ON public.credit_purchase_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_purchase_requests;

-- Create trigger for updated_at
CREATE TRIGGER update_credit_purchase_requests_updated_at
BEFORE UPDATE ON public.credit_purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();