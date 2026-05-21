CREATE TABLE public.perf_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  page TEXT NOT NULL,
  metric TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perf_metrics_created_at ON public.perf_metrics (created_at DESC);
CREATE INDEX idx_perf_metrics_page_metric ON public.perf_metrics (page, metric, created_at DESC);

ALTER TABLE public.perf_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert perf metrics"
ON public.perf_metrics FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read perf metrics"
ON public.perf_metrics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Aggregation function: returns per-metric stats for a page over the last N minutes
CREATE OR REPLACE FUNCTION public.get_perf_summary(
  _page TEXT DEFAULT NULL,
  _since_minutes INTEGER DEFAULT 1440
)
RETURNS TABLE (
  page TEXT,
  metric TEXT,
  samples BIGINT,
  avg_ms NUMERIC,
  p50_ms NUMERIC,
  p95_ms NUMERIC,
  p99_ms NUMERIC,
  max_ms INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pm.page,
    pm.metric,
    COUNT(*)::BIGINT AS samples,
    ROUND(AVG(pm.duration_ms)::NUMERIC, 1) AS avg_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm.duration_ms)::NUMERIC AS p50_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.duration_ms)::NUMERIC AS p95_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pm.duration_ms)::NUMERIC AS p99_ms,
    MAX(pm.duration_ms) AS max_ms
  FROM public.perf_metrics pm
  WHERE pm.created_at >= now() - make_interval(mins => _since_minutes)
    AND (_page IS NULL OR pm.page = _page)
    AND public.has_role(auth.uid(), 'admin')
  GROUP BY pm.page, pm.metric
  ORDER BY pm.page, pm.metric;
$$;

-- Buckets (per-hour) for a given page+metric
CREATE OR REPLACE FUNCTION public.get_perf_timeseries(
  _page TEXT,
  _metric TEXT,
  _since_minutes INTEGER DEFAULT 1440
)
RETURNS TABLE (
  bucket TIMESTAMPTZ,
  samples BIGINT,
  avg_ms NUMERIC,
  p95_ms NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('hour', pm.created_at) AS bucket,
    COUNT(*)::BIGINT,
    ROUND(AVG(pm.duration_ms)::NUMERIC, 1),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.duration_ms)::NUMERIC
  FROM public.perf_metrics pm
  WHERE pm.created_at >= now() - make_interval(mins => _since_minutes)
    AND pm.page = _page
    AND pm.metric = _metric
    AND public.has_role(auth.uid(), 'admin')
  GROUP BY 1
  ORDER BY 1;
$$;

-- Error count summary (uses existing error_logs table)
CREATE OR REPLACE FUNCTION public.get_error_summary(_since_minutes INTEGER DEFAULT 1440)
RETURNS TABLE (
  total BIGINT,
  by_source JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT error_source FROM public.error_logs
    WHERE created_at >= now() - make_interval(mins => _since_minutes)
      AND public.has_role(auth.uid(), 'admin')
  )
  SELECT
    (SELECT COUNT(*) FROM recent),
    COALESCE(
      (SELECT jsonb_object_agg(error_source, c)
       FROM (SELECT error_source, COUNT(*) AS c FROM recent GROUP BY error_source) s),
      '{}'::jsonb
    );
$$;