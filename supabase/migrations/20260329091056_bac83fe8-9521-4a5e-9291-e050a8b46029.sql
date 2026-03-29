
-- RPC to record infractions (system/staff only, called from triggers or edge functions)
-- But since the forbidden word check runs client-side, we need a SECURITY DEFINER function
-- that validates the caller is the user being infracted (self-reporting from automated detection)
CREATE OR REPLACE FUNCTION public.record_user_infraction(
  _user_id uuid,
  _detected_word text,
  _message_content text,
  _context text,
  _warning_number integer,
  _is_sanctioned boolean,
  _support_ticket_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only the system (edge functions) or the user themselves can record
  -- This is called by the automated forbidden word detection system
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  INSERT INTO public.user_infractions (user_id, detected_word, message_content, context, warning_number, is_sanctioned, support_ticket_id)
  VALUES (_user_id, _detected_word, _message_content, _context, _warning_number, _is_sanctioned, _support_ticket_id);
END;
$$;
