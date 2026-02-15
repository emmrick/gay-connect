
-- Create moderation task queue table
CREATE TABLE public.moderation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type TEXT NOT NULL, -- 'identity_verification', 'report_review', 'content_moderation', etc.
  target_entity_id UUID, -- ID of the verification, report, etc.
  target_user_id UUID, -- User concerned by the task
  reward_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reserved, completed, refused, expired
  reserved_by UUID,
  reserved_at TIMESTAMPTZ,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  refused_by UUID[] DEFAULT '{}', -- track who refused so we don't re-offer
  metadata JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_tasks ENABLE ROW LEVEL SECURITY;

-- Admins and moderators can view pending/reserved tasks
CREATE POLICY "Admins and moderators can view tasks"
ON public.moderation_tasks
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
);

-- Admins and moderators can update tasks (reserve, complete, refuse)
CREATE POLICY "Admins and moderators can update tasks"
ON public.moderation_tasks
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
);

-- Admins and moderators can insert tasks
CREATE POLICY "Admins and moderators can insert tasks"
ON public.moderation_tasks
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
);

-- Index for fast lookups
CREATE INDEX idx_moderation_tasks_status ON public.moderation_tasks(status);
CREATE INDEX idx_moderation_tasks_reserved ON public.moderation_tasks(reserved_by, status);

-- Function to reserve a task atomically (prevents duplicates)
CREATE OR REPLACE FUNCTION public.reserve_moderation_task(_task_id UUID, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
  _active_task RECORD;
BEGIN
  -- Check if user already has an active reserved task
  SELECT id INTO _active_task
  FROM public.moderation_tasks
  WHERE reserved_by = _user_id
    AND status = 'reserved'
    AND reserved_at > now() - interval '5 minutes'
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà une tâche en cours. Terminez-la avant d''en accepter une nouvelle.');
  END IF;

  -- Try to atomically reserve the task
  UPDATE public.moderation_tasks
  SET status = 'reserved',
      reserved_by = _user_id,
      reserved_at = now(),
      updated_at = now()
  WHERE id = _task_id
    AND status = 'pending'
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

-- Function to refuse a task (goes back to pool, excluding this user)
CREATE OR REPLACE FUNCTION public.refuse_moderation_task(_task_id UUID, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.moderation_tasks
  SET status = 'pending',
      reserved_by = NULL,
      reserved_at = NULL,
      refused_by = array_append(COALESCE(refused_by, '{}'), _user_id),
      updated_at = now()
  WHERE id = _task_id
    AND reserved_by = _user_id
    AND status = 'reserved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tâche introuvable ou non réservée par vous.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to complete a task
CREATE OR REPLACE FUNCTION public.complete_moderation_task(_task_id UUID, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
BEGIN
  UPDATE public.moderation_tasks
  SET status = 'completed',
      completed_by = _user_id,
      completed_at = now(),
      updated_at = now()
  WHERE id = _task_id
    AND reserved_by = _user_id
    AND status = 'reserved'
  RETURNING * INTO _task;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tâche introuvable ou non réservée par vous.');
  END IF;

  RETURN jsonb_build_object('success', true, 'task_id', _task.id, 'reward_cents', _task.reward_cents);
END;
$$;

-- Function to expire stale reserved tasks (called periodically or on query)
CREATE OR REPLACE FUNCTION public.expire_stale_moderation_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.moderation_tasks
  SET status = 'pending',
      reserved_by = NULL,
      reserved_at = NULL,
      updated_at = now()
  WHERE status = 'reserved'
    AND reserved_at < now() - interval '5 minutes';

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- Enable realtime for task updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_tasks;
