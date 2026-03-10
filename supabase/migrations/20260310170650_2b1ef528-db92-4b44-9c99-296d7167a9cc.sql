CREATE OR REPLACE FUNCTION public.notify_moderators_new_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _mod RECORD;
  _supabase_url TEXT;
  _service_key TEXT;
BEGIN
  -- Get Supabase URL for edge function calls
  SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1;

  -- Send push notification + in-app notification to all moderators/admins
  FOR _mod IN 
    SELECT DISTINCT ur.user_id 
    FROM public.user_roles ur 
    WHERE ur.role IN ('admin', 'moderator')
  LOOP
    -- Create in-app notification
    INSERT INTO public.notifications (user_id, type, title, message, action_url, is_read)
    VALUES (
      _mod.user_id,
      'system',
      '🔔 Nouvelle mission disponible',
      COALESCE(NEW.description, 'Une nouvelle mission de modération est en attente.'),
      '/admin',
      false
    );

    -- Send push notification via pg_net to edge function
    IF _supabase_url IS NOT NULL AND _service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_key
        ),
        body := jsonb_build_object(
          'userId', _mod.user_id::text,
          'title', '🔔 Nouvelle mission',
          'body', COALESCE(NEW.description, 'Une mission de modération est en attente.'),
          'url', '/admin',
          'tag', 'mission-' || NEW.id::text,
          'notificationType', 'system'
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;