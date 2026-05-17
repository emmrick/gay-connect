-- Photo Exchange feature

CREATE TABLE public.photo_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','awaiting_review','completed','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_photo_exchanges_conv ON public.photo_exchanges(conversation_id);
CREATE INDEX idx_photo_exchanges_users ON public.photo_exchanges(initiator_id, recipient_id);

CREATE TABLE public.photo_exchange_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.photo_exchanges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  review_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  retry_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exchange_id, user_id)
);
CREATE INDEX idx_photo_exchange_photos_exchange ON public.photo_exchange_photos(exchange_id);

CREATE TRIGGER trg_photo_exchanges_updated
  BEFORE UPDATE ON public.photo_exchanges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_photo_exchange_photos_updated
  BEFORE UPDATE ON public.photo_exchange_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_photo_exchange_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'admin')
    OR EXISTS (SELECT 1 FROM public.moderator_permissions mp
               WHERE mp.user_id = _uid AND mp.can_manage_content = true);
$$;
REVOKE EXECUTE ON FUNCTION public.is_photo_exchange_staff(uuid) FROM anon;

ALTER TABLE public.photo_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_exchange_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and staff can view exchanges"
  ON public.photo_exchanges FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = recipient_id
         OR public.is_photo_exchange_staff(auth.uid()));

CREATE POLICY "Initiator can create exchange"
  ON public.photo_exchanges FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Participants can update exchange"
  ON public.photo_exchanges FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = recipient_id
         OR public.is_photo_exchange_staff(auth.uid()));

CREATE POLICY "Read own / staff / completed exchange"
  ON public.photo_exchange_photos FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_photo_exchange_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.photo_exchanges e
      WHERE e.id = photo_exchange_photos.exchange_id
        AND (auth.uid() = e.initiator_id OR auth.uid() = e.recipient_id)
        AND e.status = 'completed'
        AND photo_exchange_photos.review_status = 'approved'
    )
  );

CREATE POLICY "Participants insert own photo"
  ON public.photo_exchange_photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.photo_exchanges e
      WHERE e.id = exchange_id
        AND (auth.uid() = e.initiator_id OR auth.uid() = e.recipient_id)
        AND e.status IN ('accepted','awaiting_review')
    )
  );

CREATE POLICY "Owner or staff can update photo"
  ON public.photo_exchange_photos FOR UPDATE
  USING (auth.uid() = user_id OR public.is_photo_exchange_staff(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-exchanges', 'photo-exchanges', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Photo exchange: owner uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photo-exchanges'
              AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photo exchange: owner reads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photo-exchanges'
         AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photo exchange: staff reads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photo-exchanges'
         AND public.is_photo_exchange_staff(auth.uid()));

CREATE POLICY "Photo exchange: owner deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photo-exchanges'
         AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE OR REPLACE FUNCTION public.get_photo_exchange_signed_url(_photo_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE
  v_path text; v_user uuid; v_review_status text;
  v_exchange_status text; v_initiator uuid; v_recipient uuid;
  v_can boolean := false;
BEGIN
  SELECT p.storage_path, p.user_id, p.review_status,
         e.status, e.initiator_id, e.recipient_id
    INTO v_path, v_user, v_review_status, v_exchange_status, v_initiator, v_recipient
  FROM public.photo_exchange_photos p
  JOIN public.photo_exchanges e ON e.id = p.exchange_id
  WHERE p.id = _photo_id;

  IF v_path IS NULL THEN RAISE EXCEPTION 'Photo not found'; END IF;

  IF auth.uid() = v_user THEN v_can := true; END IF;
  IF public.is_photo_exchange_staff(auth.uid()) THEN v_can := true; END IF;
  IF (auth.uid() = v_initiator OR auth.uid() = v_recipient)
     AND v_exchange_status = 'completed'
     AND v_review_status = 'approved'
  THEN v_can := true; END IF;

  IF NOT v_can THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN (storage.create_signed_url('photo-exchanges', v_path, 3600)).signed_url;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_photo_exchange_signed_url(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.handle_photo_exchange_photo_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count int; v_approved int; v_status text;
BEGIN
  SELECT status INTO v_status FROM public.photo_exchanges WHERE id = NEW.exchange_id;
  SELECT COUNT(*) INTO v_count FROM public.photo_exchange_photos WHERE exchange_id = NEW.exchange_id;

  IF v_count >= 2 AND v_status = 'accepted' THEN
    UPDATE public.photo_exchanges
      SET status = 'awaiting_review', updated_at = now()
      WHERE id = NEW.exchange_id;

    INSERT INTO public.moderation_tasks (
      task_type, target_entity_id, reward_cents, status, description, metadata
    ) VALUES (
      'photo_exchange_review', NEW.exchange_id, 30, 'pending',
      'Vérifier un échange de photos entre deux membres',
      jsonb_build_object('exchange_id', NEW.exchange_id)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.review_status = 'approved' THEN
    SELECT COUNT(*) INTO v_approved
      FROM public.photo_exchange_photos
      WHERE exchange_id = NEW.exchange_id AND review_status = 'approved';
    IF v_approved >= 2 THEN
      UPDATE public.photo_exchanges
        SET status = 'completed', updated_at = now()
        WHERE id = NEW.exchange_id AND status <> 'completed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_photo_exchange_photo_change
  AFTER INSERT OR UPDATE OF review_status ON public.photo_exchange_photos
  FOR EACH ROW EXECUTE FUNCTION public.handle_photo_exchange_photo_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_exchanges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_exchange_photos;