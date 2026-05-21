/**
 * Léger collecteur de métriques de performance côté client.
 * - File d'attente + flush groupé toutes les 5s (ou onbeforeunload)
 * - Échantillonnage configurable pour éviter de saturer la BDD
 * - Fire-and-forget : ne ralentit jamais l'UI
 */
import { supabase } from '@/integrations/supabase/client';

type PerfRow = {
  user_id: string | null;
  page: string;
  metric: string;
  duration_ms: number;
  metadata: Record<string, unknown>;
};

const SAMPLE_RATE = 0.25; // 25 % des évènements remontés
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 50;

let queue: PerfRow[] = [];
let timer: number | null = null;
let cachedUserId: string | null = null;

supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user?.id ?? null;
});
supabase.auth.onAuthStateChange((_e, session) => {
  cachedUserId = session?.user?.id ?? null;
});

const flush = async () => {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    await supabase.from('perf_metrics' as any).insert(batch);
  } catch {
    // silencieux : on ne re-queue pas pour éviter les boucles
  }
};

const scheduleFlush = () => {
  if (timer != null) return;
  timer = window.setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (queue.length) flush();
  });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && queue.length) flush();
  });
}

export const recordPerfMetric = (
  page: string,
  metric: string,
  durationMs: number,
  metadata: Record<string, unknown> = {},
) => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  if (Math.random() > SAMPLE_RATE) return;
  if (queue.length >= MAX_QUEUE) return;
  queue.push({
    user_id: cachedUserId,
    page,
    metric,
    duration_ms: Math.round(durationMs),
    metadata,
  });
  scheduleFlush();
};

/** Mesure le temps d'exécution d'une promesse et enregistre une métrique. */
export const measureAsync = async <T,>(
  page: string,
  metric: string,
  fn: () => Promise<T>,
  metadata: Record<string, unknown> = {},
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    recordPerfMetric(page, metric, performance.now() - start, { ...metadata, ok: true });
    return result;
  } catch (err) {
    recordPerfMetric(page, metric, performance.now() - start, {
      ...metadata,
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200),
    });
    throw err;
  }
};
