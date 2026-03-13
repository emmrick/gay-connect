CREATE OR REPLACE FUNCTION public.auto_reopen_ticket_on_client_message()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _ticket RECORD;
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
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_reopen_on_client_message ON public.support_messages;
CREATE TRIGGER trg_auto_reopen_on_client_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_reopen_ticket_on_client_message();