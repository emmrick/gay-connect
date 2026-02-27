
CREATE TABLE public.admin_popups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  popup_type text NOT NULL DEFAULT 'promotion',
  is_active boolean NOT NULL DEFAULT true,
  icon text DEFAULT 'gift',
  button_text text DEFAULT 'OK',
  button_action text DEFAULT null,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.admin_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active popups" ON public.admin_popups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage popups" ON public.admin_popups
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can manage popups" ON public.admin_popups
  FOR ALL USING (has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_popups;
