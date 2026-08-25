CREATE TABLE public.cron_schedule_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL UNIQUE,
  schedule text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cron_schedule_config TO authenticated;
GRANT ALL ON public.cron_schedule_config TO service_role;

ALTER TABLE public.cron_schedule_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read cron schedule config"
ON public.cron_schedule_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage cron schedule config"
ON public.cron_schedule_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_cron_schedule_config_updated_at
BEFORE UPDATE ON public.cron_schedule_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Applique la configuration à pg_cron (un seul job = une seule ligne)
CREATE OR REPLACE FUNCTION public.apply_cron_schedule_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = NEW.job_name;
  IF v_jobid IS NULL THEN
    UPDATE public.cron_schedule_config
      SET sync_error = 'Tâche planifiée introuvable dans pg_cron', last_synced_at = now()
      WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  PERFORM cron.alter_job(v_jobid, schedule := NEW.schedule, active := NEW.is_active);

  UPDATE public.cron_schedule_config
    SET sync_error = NULL, last_synced_at = now()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_cron_schedule_config() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_apply_cron_schedule_config
AFTER INSERT OR UPDATE OF schedule, is_active ON public.cron_schedule_config
FOR EACH ROW EXECUTE FUNCTION public.apply_cron_schedule_config();

-- Seed depuis l'état actuel de pg_cron
INSERT INTO public.cron_schedule_config (job_name, schedule, is_active, last_synced_at)
SELECT jobname, schedule, active, now() FROM cron.job
ON CONFLICT (job_name) DO NOTHING;

-- Ré-synchronise toute la configuration (utile après restauration)
CREATE OR REPLACE FUNCTION public.resync_all_cron_schedules()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  r record;
  v_jobid bigint;
  n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  FOR r IN SELECT * FROM public.cron_schedule_config LOOP
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = r.job_name;
    IF v_jobid IS NOT NULL THEN
      PERFORM cron.alter_job(v_jobid, schedule := r.schedule, active := r.is_active);
      UPDATE public.cron_schedule_config SET sync_error = NULL, last_synced_at = now() WHERE id = r.id;
      n := n + 1;
    ELSE
      UPDATE public.cron_schedule_config SET sync_error = 'Tâche planifiée introuvable dans pg_cron', last_synced_at = now() WHERE id = r.id;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.resync_all_cron_schedules() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resync_all_cron_schedules() TO authenticated;