
CREATE OR REPLACE FUNCTION public.get_exclusive_next_task(
  _user_id uuid,
  _offer_ttl_seconds integer DEFAULT 60
)
RETURNS SETOF public.moderation_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _task RECORD;
  _is_online BOOLEAN;
BEGIN
  -- Check if the requesting user is currently online (active within last 5 minutes)
  SELECT (p.is_online = true AND p.last_seen > now() - interval '5 minutes')
  INTO _is_online
  FROM public.profiles p
  WHERE p.user_id = _user_id;

  -- If user is not online, don't offer any task
  IF NOT COALESCE(_is_online, false) THEN
    RETURN;
  END IF;

  -- First, check if this user already has an active (non-expired) offer
  SELECT * INTO _task
  FROM public.moderation_tasks
  WHERE offered_to = _user_id
    AND status = 'pending'
    AND offered_at > now() - (_offer_ttl_seconds || ' seconds')::interval
  LIMIT 1;

  IF FOUND THEN
    RETURN NEXT _task;
    RETURN;
  END IF;

  -- Auto-refuse expired offers: if a task was offered to someone and they let it expire,
  -- add them to refused_by so they don't get it again
  UPDATE public.moderation_tasks
  SET refused_by = array_append(COALESCE(refused_by, '{}'), offered_to::text),
      offered_to = NULL,
      offered_at = NULL,
      updated_at = now()
  WHERE status = 'pending'
    AND offered_to IS NOT NULL
    AND offered_at <= now() - (_offer_ttl_seconds || ' seconds')::interval;

  -- Find the next available pending task using RANDOM ORDER for fair distribution
  -- This ensures tasks are not always assigned to the same moderator who polls first
  SELECT * INTO _task
  FROM public.moderation_tasks
  WHERE status = 'pending'
    AND NOT (_user_id::text = ANY(COALESCE(refused_by, '{}')))
    AND (offered_to IS NULL)
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check if there are other online moderators who haven't refused this task
  -- If so, randomly decide whether to offer to THIS caller or skip (50% chance per poll)
  -- This creates fair random distribution across moderators
  DECLARE
    _other_online_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO _other_online_count
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role IN ('admin', 'moderator')
      AND p.user_id != _user_id
      AND p.is_online = true
      AND p.last_seen > now() - interval '5 minutes'
      AND NOT (p.user_id::text = ANY(COALESCE(_task.refused_by, '{}')));

    -- If other moderators are online, use randomness to distribute fairly
    -- Each moderator has a 1/(online_count) chance of getting the task per poll cycle
    IF _other_online_count > 0 THEN
      IF random() > (1.0 / (_other_online_count + 1)) THEN
        -- Skip this time, let another moderator pick it up
        RETURN;
      END IF;
    END IF;
  END;

  -- Atomically assign the offer to this user
  UPDATE public.moderation_tasks
  SET offered_to = _user_id,
      offered_at = now()
  WHERE id = _task.id;

  _task.offered_to := _user_id;
  _task.offered_at := now();

  RETURN NEXT _task;
  RETURN;
END;
$function$;
