
-- Create trigger to auto-create a support task when a ticket is reopened (status changes to 'open')
CREATE OR REPLACE FUNCTION public.create_support_task_on_reopen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rate_cents INTEGER;
  _username TEXT;
BEGIN
  -- Only fire when status changes from 'waiting_client' to 'open'
  IF OLD.status = 'waiting_client' AND NEW.status = 'open' THEN
    SELECT rate_cents INTO _rate_cents FROM public.task_rates WHERE task_type = 'support_chat' AND is_active = true;
    SELECT username INTO _username FROM public.profiles WHERE user_id = NEW.user_id;

    -- Avoid duplicate pending/reserved tasks for the same ticket
    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks 
      WHERE target_entity_id = NEW.id 
        AND task_type = 'support_chat' 
        AND status IN ('pending', 'reserved')
    ) THEN
      INSERT INTO public.moderation_tasks (task_type, target_entity_id, target_user_id, reward_cents, description, metadata)
      VALUES (
        'support_chat',
        NEW.id,
        NEW.user_id,
        COALESCE(_rate_cents, 5),
        'Reprise support #' || NEW.ticket_number || ' de ' || COALESCE(_username, 'un utilisateur'),
        jsonb_build_object('ticket_id', NEW.id, 'ticket_number', NEW.ticket_number, 'username', _username, 'subject', NEW.subject, 'reopened', true)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_support_task_on_reopen
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_support_task_on_reopen();
