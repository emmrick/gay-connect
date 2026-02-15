
-- Trigger: when a new identity verification is submitted, create a moderation task
CREATE OR REPLACE FUNCTION public.create_verification_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rate_cents INTEGER;
  _username TEXT;
BEGIN
  -- Only create task when status becomes 'submitted' or 'pending'
  IF NEW.status IN ('submitted', 'pending') AND (OLD IS NULL OR OLD.status NOT IN ('submitted', 'pending')) THEN
    -- Get the rate for identity verification
    SELECT rate_cents INTO _rate_cents FROM public.task_rates WHERE task_type = 'identity_verification' AND is_active = true;
    
    -- Get username
    SELECT username INTO _username FROM public.profiles WHERE user_id = NEW.user_id;

    -- Check no duplicate pending task for this entity
    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks 
      WHERE target_entity_id = NEW.id 
        AND task_type = 'identity_verification' 
        AND status IN ('pending', 'reserved')
    ) THEN
      INSERT INTO public.moderation_tasks (task_type, target_entity_id, target_user_id, reward_cents, description, metadata)
      VALUES (
        'identity_verification',
        NEW.id,
        NEW.user_id,
        COALESCE(_rate_cents, 50),
        'Vérifier l''identité de ' || COALESCE(_username, 'un utilisateur'),
        jsonb_build_object('verification_id', NEW.id, 'username', _username)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_verification_task
AFTER INSERT OR UPDATE ON public.identity_verifications
FOR EACH ROW
EXECUTE FUNCTION public.create_verification_task();

-- Trigger: when a new report is created, create a moderation task
CREATE OR REPLACE FUNCTION public.create_report_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rate_cents INTEGER;
  _reporter_username TEXT;
  _reported_username TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT rate_cents INTO _rate_cents FROM public.task_rates WHERE task_type = 'report_response' AND is_active = true;
    SELECT username INTO _reporter_username FROM public.profiles WHERE user_id = NEW.reporter_id;
    SELECT username INTO _reported_username FROM public.profiles WHERE user_id = NEW.reported_user_id;

    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks 
      WHERE target_entity_id = NEW.id 
        AND task_type = 'report_review' 
        AND status IN ('pending', 'reserved')
    ) THEN
      INSERT INTO public.moderation_tasks (task_type, target_entity_id, target_user_id, reward_cents, description, metadata)
      VALUES (
        'report_review',
        NEW.id,
        NEW.reported_user_id,
        COALESCE(_rate_cents, 20),
        'Signalement de ' || COALESCE(_reported_username, 'un utilisateur') || ' par ' || COALESCE(_reporter_username, 'un membre'),
        jsonb_build_object('report_id', NEW.id, 'reason', NEW.reason, 'reporter', _reporter_username, 'reported', _reported_username)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_report_task
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.create_report_task();

-- Trigger: when a credit purchase request is created, create a moderation task
CREATE OR REPLACE FUNCTION public.create_credit_purchase_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rate_cents INTEGER;
  _username TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT rate_cents INTO _rate_cents FROM public.task_rates WHERE task_type = 'credit_management' AND is_active = true;
    SELECT username INTO _username FROM public.profiles WHERE user_id = NEW.user_id;

    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks 
      WHERE target_entity_id = NEW.id 
        AND task_type = 'credit_management' 
        AND status IN ('pending', 'reserved')
    ) THEN
      INSERT INTO public.moderation_tasks (task_type, target_entity_id, target_user_id, reward_cents, description, metadata)
      VALUES (
        'credit_management',
        NEW.id,
        NEW.user_id,
        COALESCE(_rate_cents, 1),
        'Demande d''achat de ' || NEW.amount || ' crédits par ' || COALESCE(_username, 'un utilisateur'),
        jsonb_build_object('purchase_id', NEW.id, 'amount', NEW.amount, 'username', _username)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_credit_purchase_task
AFTER INSERT ON public.credit_purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_credit_purchase_task();
