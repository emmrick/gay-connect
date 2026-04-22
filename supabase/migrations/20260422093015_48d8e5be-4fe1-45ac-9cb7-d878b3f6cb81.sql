CREATE OR REPLACE FUNCTION public.auto_reopen_ticket_on_client_message()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _ticket RECORD;
  _rate_cents INTEGER;
  _username TEXT;
BEGIN
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _ticket
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF _ticket.status = 'waiting_client' AND NEW.sender_id = _ticket.user_id THEN
    UPDATE public.support_tickets
    SET status = 'open', assigned_to = NULL
    WHERE id = NEW.ticket_id;

    IF NOT EXISTS (
      SELECT 1 FROM public.moderation_tasks
      WHERE target_entity_id = NEW.ticket_id
        AND task_type = 'support_chat'
        AND status IN ('pending', 'reserved')
    ) THEN
      SELECT rate_cents INTO _rate_cents
      FROM public.task_rates
      WHERE task_type = 'support_chat' AND is_active = true
      LIMIT 1;

      SELECT username INTO _username
      FROM public.profiles
      WHERE user_id = _ticket.user_id;

      INSERT INTO public.moderation_tasks (
        task_type, target_entity_id, target_user_id, reward_cents, description, metadata
      ) VALUES (
        'support_chat',
        _ticket.id,
        _ticket.user_id,
        COALESCE(_rate_cents, 5),
        'Reprise support #' || _ticket.ticket_number || ' de ' || COALESCE(_username, 'un utilisateur'),
        jsonb_build_object(
          'ticket_id', _ticket.id,
          'ticket_number', _ticket.ticket_number,
          'username', _username,
          'subject', _ticket.subject,
          'reopened', true,
          'trigger_source', 'client_reply'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;