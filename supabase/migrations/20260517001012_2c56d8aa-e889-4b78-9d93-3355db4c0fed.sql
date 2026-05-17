-- Atomic suggestion decision: updates status + awards credits idempotently
CREATE OR REPLACE FUNCTION public.process_suggestion_decision(
  p_suggestion_id uuid,
  p_status text,
  p_admin_notes text DEFAULT NULL,
  p_credits_awarded integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_row public.user_suggestions%ROWTYPE;
  v_previous_status text;
  v_previous_credits integer;
  v_credits_to_add integer := 0;
BEGIN
  -- AuthZ: admin or moderator
  IF v_caller IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF NOT (public.has_role(v_caller, 'admin'::app_role) OR public.has_role(v_caller, 'moderator'::app_role)) THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Lock the row
  SELECT * INTO v_row FROM public.user_suggestions WHERE id = p_suggestion_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Idée introuvable');
  END IF;

  v_previous_status := v_row.status;
  v_previous_credits := COALESCE(v_row.credits_awarded, 0);

  -- Update suggestion
  UPDATE public.user_suggestions
  SET status = p_status,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      credits_awarded = GREATEST(COALESCE(p_credits_awarded, 0), 0),
      reviewed_by = v_caller,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_suggestion_id
  RETURNING * INTO v_row;

  -- Credit author only on approval, and only the *delta* not yet credited
  -- (so re-approving doesn't double-credit, but raising the reward later still pays the difference)
  IF p_status = 'approved' AND COALESCE(p_credits_awarded, 0) > 0 THEN
    IF v_previous_status = 'approved' THEN
      v_credits_to_add := GREATEST(p_credits_awarded - v_previous_credits, 0);
    ELSE
      v_credits_to_add := p_credits_awarded;
    END IF;

    IF v_credits_to_add > 0 THEN
      INSERT INTO public.user_credits (user_id) VALUES (v_row.user_id)
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.user_credits
      SET bonus_credits = bonus_credits + v_credits_to_add,
          updated_at = now()
      WHERE user_id = v_row.user_id;

      INSERT INTO public.credit_transactions (user_id, amount, credit_type, transaction_type, description)
      VALUES (v_row.user_id, v_credits_to_add, 'bonus', 'suggestion_reward',
              'Idée approuvée : ' || COALESCE(v_row.title, ''));
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'status', v_row.status,
    'credits_awarded', v_row.credits_awarded,
    'credits_added_now', v_credits_to_add
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_suggestion_decision(uuid, text, text, integer) TO authenticated;

-- Backfill: credit the existing approved suggestion that wasn't credited
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT s.id, s.user_id, s.title
    FROM public.user_suggestions s
    WHERE s.status = 'approved'
      AND COALESCE(s.credits_awarded, 0) = 0
  LOOP
    UPDATE public.user_suggestions
    SET credits_awarded = 30, updated_at = now()
    WHERE id = r.id;

    INSERT INTO public.user_credits (user_id) VALUES (r.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.user_credits
    SET bonus_credits = bonus_credits + 30, updated_at = now()
    WHERE user_id = r.user_id;

    INSERT INTO public.credit_transactions (user_id, amount, credit_type, transaction_type, description)
    VALUES (r.user_id, 30, 'bonus', 'suggestion_reward',
            'Rattrapage récompense idée approuvée : ' || COALESCE(r.title, ''));
  END LOOP;
END $$;