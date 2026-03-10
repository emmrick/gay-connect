CREATE OR REPLACE FUNCTION public.notify_moderators_new_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _mod RECORD;
  _supabase_url TEXT := 'https://vxrsqftlaguiwprcqlbw.supabase.co';
  _anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnNxZnRsYWd1aXdwcmNxbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQ1ODgsImV4cCI6MjA4NTIwMDU4OH0.Hcpc4GFLyV3zreSW3hfVzAHaHnMtA9fEivYf2C2MSHc';
BEGIN
  -- Send in-app notifications to all moderators/admins
  FOR _mod IN 
    SELECT DISTINCT ur.user_id 
    FROM public.user_roles ur 
    WHERE ur.role IN ('admin', 'moderator')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, action_url, is_read)
    VALUES (
      _mod.user_id,
      'system',
      '🔔 Nouvelle mission disponible',
      COALESCE(NEW.description, 'Une nouvelle mission de modération est en attente.'),
      '/admin',
      false
    );
  END LOOP;

  -- Send push notifications via pg_net to dedicated edge function
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/notify-mission-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key,
      'apikey', _anon_key
    ),
    body := jsonb_build_object(
      'task_id', NEW.id::text,
      'task_type', NEW.task_type,
      'description', COALESCE(NEW.description, ''),
      'reward_cents', NEW.reward_cents
    )
  );
  
  RETURN NEW;
END;
$function$;