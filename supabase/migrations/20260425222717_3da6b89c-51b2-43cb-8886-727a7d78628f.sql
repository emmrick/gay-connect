-- Realtime: publier ephemeral_media (messages et tweens déjà publiés)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ephemeral_media'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ephemeral_media';
  END IF;
END $$;

-- REPLICA IDENTITY FULL pour avoir le payload complet sur INSERT temps réel
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.tweens REPLICA IDENTITY FULL;
ALTER TABLE public.ephemeral_media REPLICA IDENTITY FULL;