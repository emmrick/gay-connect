
-- Add phone_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Create table for OTP verification codes for client dossier access
CREATE TABLE IF NOT EXISTS public.support_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_id uuid,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  interrupted_at timestamptz,
  interrupt_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.support_otp_codes ENABLE ROW LEVEL SECURITY;

-- Only admins/moderators can create and verify OTP codes
CREATE POLICY "Admins and moderators can manage OTP codes" ON public.support_otp_codes
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- Users can view their own OTP codes (for interruption)
CREATE POLICY "Users can view own OTP codes" ON public.support_otp_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own OTP codes (for interruption)
CREATE POLICY "Users can interrupt own OTP codes" ON public.support_otp_codes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create table for visitor support sessions (non-logged users)
CREATE TABLE IF NOT EXISTS public.visitor_support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone_number text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE public.visitor_support_sessions ENABLE ROW LEVEL SECURITY;

-- Visitors can create sessions (anon)
CREATE POLICY "Anyone can create visitor sessions" ON public.visitor_support_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins/moderators can view all visitor sessions
CREATE POLICY "Admins can manage visitor sessions" ON public.visitor_support_sessions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- Create table for visitor support messages
CREATE TABLE IF NOT EXISTS public.visitor_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.visitor_support_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'visitor',
  sender_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_support_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visitor messages (visitors are anon)
CREATE POLICY "Anyone can insert visitor messages" ON public.visitor_support_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anon can read messages for their session (by session_id)
CREATE POLICY "Anyone can read visitor messages" ON public.visitor_support_messages
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admins can manage all visitor messages
CREATE POLICY "Admins can manage visitor messages" ON public.visitor_support_messages
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- Enable realtime for visitor support
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_support_sessions;
