-- Create a function to send welcome notification on first login
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert welcome notification for the new user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    is_read
  ) VALUES (
    NEW.user_id,
    'welcome',
    '🎉 Bienvenue sur GayConnect !',
    'Le site est actuellement en bêta. Invitez vos amis pour agrandir la communauté ! Certaines fonctionnalités peuvent ne pas fonctionner correctement et c''est normal. On compte sur vous pour nous faire remonter les informations. Amusez-vous bien ! 🏳️‍🌈',
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to send welcome notification when a new profile is created
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;

CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_notification();