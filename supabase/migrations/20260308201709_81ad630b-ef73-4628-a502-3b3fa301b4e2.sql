
-- Add birth_date and show_birthday to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_birthday boolean DEFAULT true;

-- Create birthday_gifts table to track who gave credits to whom on birthdays
CREATE TABLE IF NOT EXISTS public.birthday_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 1,
  gift_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, recipient_id, gift_year)
);

-- Enable RLS
ALTER TABLE public.birthday_gifts ENABLE ROW LEVEL SECURITY;

-- Users can insert gifts (send)
CREATE POLICY "Users can send birthday gifts" ON public.birthday_gifts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can see gifts they sent or received
CREATE POLICY "Users can view own gifts" ON public.birthday_gifts
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
