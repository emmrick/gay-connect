CREATE OR REPLACE FUNCTION public.review_photo_exchange_photo(
  _photo_id uuid,
  _decision text,           -- 'approved' | 'rejected'
  _reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_exchange_id uuid;
  v_pending_left int;
  v_rejected_count int;
  v_approved_count int;
BEGIN
  IF v_caller IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF NOT public.is_photo_exchange_staff(v_caller) THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  IF _decision NOT IN ('approved', 'rejected') THEN
    RETURN json_build_object('success', false, 'error', 'Décision invalide');
  END IF;

  UPDATE public.photo_exchange_photos
  SET review_status = _decision,
      review_reason = _reason,
      reviewed_by = v_caller,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _photo_id
  RETURNING exchange_id INTO v_exchange_id;

  IF v_exchange_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Photo introuvable');
  END IF;

  -- Count statuses on this exchange
  SELECT
    COUNT(*) FILTER (WHERE review_status = 'pending'),
    COUNT(*) FILTER (WHERE review_status = 'rejected'),
    COUNT(*) FILTER (WHERE review_status = 'approved')
  INTO v_pending_left, v_rejected_count, v_approved_count
  FROM public.photo_exchange_photos
  WHERE exchange_id = v_exchange_id;

  -- Update related moderation task once all photos reviewed
  IF v_pending_left = 0 THEN
    IF v_rejected_count > 0 THEN
      -- Some rejected: leave exchange in awaiting_review so user can retry
      -- Mark mission as completed (work is done; user retry will re-insert a task)
      UPDATE public.moderation_tasks
      SET status = 'completed',
          completed_by = v_caller,
          completed_at = now(),
          updated_at = now()
      WHERE task_type = 'photo_exchange_review'
        AND target_entity_id = v_exchange_id
        AND status IN ('pending', 'reserved');
    ELSE
      -- Both approved: trigger on photos already flipped exchange to completed
      UPDATE public.moderation_tasks
      SET status = 'completed',
          completed_by = v_caller,
          completed_at = now(),
          updated_at = now()
      WHERE task_type = 'photo_exchange_review'
        AND target_entity_id = v_exchange_id
        AND status IN ('pending', 'reserved');
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'exchange_id', v_exchange_id,
    'pending_left', v_pending_left,
    'rejected', v_rejected_count,
    'approved', v_approved_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_photo_exchange_photo(uuid, text, text) TO authenticated;