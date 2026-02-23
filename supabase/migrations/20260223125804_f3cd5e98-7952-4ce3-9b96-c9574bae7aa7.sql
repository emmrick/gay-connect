
-- Remove the 5-minute expiration check from reserve_moderation_task
-- so that reserved tasks persist across page refreshes
CREATE OR REPLACE FUNCTION public.reserve_moderation_task(_task_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
  _active_task RECORD;
BEGIN
  -- Check if user already has an active reserved task (no time limit)
  SELECT id INTO _active_task
  FROM public.moderation_tasks
  WHERE reserved_by = _user_id
    AND status = 'reserved'
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà une tâche en cours.');
  END IF;

  -- Atomically reserve the task
  UPDATE public.moderation_tasks
  SET status = 'reserved',
      reserved_by = _user_id,
      reserved_at = now(),
      offered_to = NULL,
      offered_at = NULL,
      updated_at = now()
  WHERE id = _task_id
    AND status = 'pending'
    AND (offered_to = _user_id OR offered_to IS NULL)
    AND NOT (_user_id = ANY(COALESCE(refused_by, '{}')))
  RETURNING * INTO _task;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cette tâche n''est plus disponible.');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'task_id', _task.id,
    'task_type', _task.task_type,
    'target_entity_id', _task.target_entity_id,
    'reward_cents', _task.reward_cents
  );
END;
$$;

-- Also remove the 5-minute expiration from expire_stale_moderation_tasks
-- Reserved tasks should NOT auto-expire anymore
CREATE OR REPLACE FUNCTION public.expire_stale_moderation_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count INTEGER := 0;
BEGIN
  -- Only clear expired exclusive offers (not reserved tasks)
  UPDATE public.moderation_tasks
  SET offered_to = NULL,
      offered_at = NULL
  WHERE status = 'pending'
    AND offered_to IS NOT NULL
    AND offered_at < now() - interval '90 seconds';

  RETURN _count;
END;
$$;
