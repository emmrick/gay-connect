
-- Table for maintenance mode state
CREATE TABLE public.maintenance_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  message text DEFAULT 'Le site est en maintenance. Veuillez réessayer plus tard.',
  activated_by text NULL,
  activated_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert the single config row
INSERT INTO public.maintenance_mode (id, is_active) VALUES (gen_random_uuid(), false);

-- Enable RLS
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Everyone can read maintenance status (needed to show/hide screen)
CREATE POLICY "Anyone can read maintenance status"
  ON public.maintenance_mode FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update maintenance mode"
  ON public.maintenance_mode FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
