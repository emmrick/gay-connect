
-- 1. Trigger: create moderation task when ad is submitted
CREATE OR REPLACE FUNCTION public.create_ad_review_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rate_cents INTEGER;
BEGIN
  IF NEW.status = 'pending' AND NEW.is_active = false THEN
    SELECT rate_cents INTO _rate_cents FROM public.task_rates WHERE task_type = 'content_moderation' AND is_active = true;

    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks
      WHERE target_entity_id = NEW.id
        AND task_type = 'content_moderation'
        AND status IN ('pending', 'reserved')
    ) THEN
      INSERT INTO public.moderation_tasks (task_type, target_entity_id, reward_cents, description, metadata)
      VALUES (
        'content_moderation',
        NEW.id,
        COALESCE(_rate_cents, 10),
        'Examiner la demande de publicité : ' || NEW.title || ' (' || NEW.advertiser_name || ')',
        jsonb_build_object('ad_id', NEW.id, 'ad_title', NEW.title, 'advertiser_name', NEW.advertiser_name, 'advertiser_email', NEW.advertiser_email, 'type', 'ad_review')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_ad_review_task ON public.ads;
CREATE TRIGGER trg_create_ad_review_task
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ad_review_task();

-- 2. Improve recycle_fully_refused_tasks to also clear stale offered_to
CREATE OR REPLACE FUNCTION public.recycle_fully_refused_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  moderator_count int;
BEGIN
  -- Count total moderators/admins
  SELECT COUNT(*) INTO moderator_count FROM moderator_permissions;
  
  IF moderator_count = 0 THEN
    moderator_count := 1;
  END IF;

  -- Reset refused_by for pending tasks where everyone has refused
  UPDATE moderation_tasks
  SET refused_by = '{}'::text[], offered_to = NULL, offered_at = NULL, updated_at = now()
  WHERE status = 'pending'
    AND refused_by IS NOT NULL
    AND array_length(refused_by, 1) >= moderator_count;
END;
$$;

-- 3. Improve get_exclusive_next_task to auto-clear expired offers and work without manual recycle
CREATE OR REPLACE FUNCTION public.get_exclusive_next_task(_user_id uuid)
RETURNS SETOF moderation_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task moderation_tasks%ROWTYPE;
BEGIN
  -- First expire stale offers (90s TTL)
  UPDATE moderation_tasks
  SET offered_to = NULL, offered_at = NULL
  WHERE status = 'pending'
    AND offered_to IS NOT NULL
    AND offered_at < now() - interval '90 seconds';

  -- Auto-recycle tasks refused by all moderators
  PERFORM recycle_fully_refused_tasks();

  -- Check if user already has an active offer
  SELECT * INTO _task
  FROM moderation_tasks
  WHERE status = 'pending'
    AND offered_to = _user_id
    AND offered_at > now() - interval '90 seconds'
  LIMIT 1;

  IF FOUND THEN
    RETURN NEXT _task;
    RETURN;
  END IF;

  -- Find next available task not refused by this user, not offered to anyone
  SELECT * INTO _task
  FROM moderation_tasks
  WHERE status = 'pending'
    AND offered_to IS NULL
    AND (refused_by IS NULL OR NOT (_user_id::text = ANY(refused_by)))
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE moderation_tasks
    SET offered_to = _user_id, offered_at = now()
    WHERE id = _task.id;
    
    _task.offered_to := _user_id;
    _task.offered_at := now();
    RETURN NEXT _task;
  END IF;

  RETURN;
END;
$$;
