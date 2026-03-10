
-- Table for global feature toggles
CREATE TABLE public.feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'general',
  icon text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed to hide/show features)
CREATE POLICY "Anyone can read feature toggles"
ON public.feature_toggles FOR SELECT
TO authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update feature toggles"
ON public.feature_toggles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert feature toggles"
ON public.feature_toggles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete feature toggles"
ON public.feature_toggles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_toggles;

-- Seed default toggleable features
INSERT INTO public.feature_toggles (feature_key, label, description, category, icon) VALUES
  ('swipe_page', 'Page Swipe', 'Page de découverte par swipe des profils', 'pages', '💘'),
  ('personal_chatbot', 'ChatBot Personnel', 'ChatBot IA personnel sur les profils', 'features', '🤖'),
  ('stories', 'Stories', 'Publication et visualisation des stories', 'features', '📖'),
  ('albums', 'Albums Privés', 'Gestion et partage d''albums photo privés', 'features', '📸'),
  ('nearby_members', 'Membres à proximité', 'Affichage des membres géolocalisés à proximité', 'features', '📍'),
  ('premium', 'Page Premium', 'Page d''abonnement premium', 'pages', '👑'),
  ('credits_page', 'Page Crédits', 'Page de gestion des crédits', 'pages', '💰'),
  ('profile_boost', 'Boost de profil', 'Possibilité de booster son profil', 'features', '🚀'),
  ('voice_messages', 'Messages vocaux', 'Envoi de messages vocaux dans les chats', 'features', '🎤'),
  ('ephemeral_media', 'Médias éphémères', 'Envoi de photos/vidéos éphémères', 'features', '⏳'),
  ('group_events', 'Événements de groupe', 'Création d''événements dans les groupes', 'features', '📅'),
  ('birthday_gifts', 'Cadeaux d''anniversaire', 'Envoi de crédits pour les anniversaires', 'features', '🎂');
