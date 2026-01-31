-- Create a function to send notification when a new album share is created
CREATE OR REPLACE FUNCTION public.send_album_shared_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _album_name text;
  _owner_username text;
BEGIN
  -- Get album name
  SELECT name INTO _album_name
  FROM public.user_albums
  WHERE id = NEW.album_id;
  
  -- Get owner username
  SELECT username INTO _owner_username
  FROM public.profiles
  WHERE user_id = NEW.shared_by_user_id;
  
  -- Send notification to recipient
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    is_read
  ) VALUES (
    NEW.shared_with_user_id,
    'album_shared',
    '📸 Nouvel album partagé !',
    COALESCE(_owner_username, 'Un utilisateur') || ' t''a partagé son album privé "' || COALESCE(_album_name, 'Album privé') || '".',
    '/',
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on album_shares table for new shares
DROP TRIGGER IF EXISTS on_album_shared ON public.album_shares;

CREATE TRIGGER on_album_shared
  AFTER INSERT ON public.album_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.send_album_shared_notification();