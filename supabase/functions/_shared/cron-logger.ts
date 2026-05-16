// Helper pour journaliser les exécutions de tâches planifiées (CRON).
// Insère une ligne dans public.cron_run_log en fin d'exécution (succès ou erreur).
// Échec d'insertion silencieux pour ne jamais faire planter la tâche elle-même.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

type Details = Record<string, unknown> | null;

const getAdminClient = () => {
  const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function logCronRun(
  jobName: string,
  status: 'success' | 'error',
  opts: { durationMs?: number; errorMessage?: string; details?: Details } = {},
) {
  try {
    const supabase = getAdminClient();
    if (!supabase) return;
    await supabase.from('cron_run_log').insert({
      job_name: jobName,
      status,
      duration_ms: opts.durationMs ?? null,
      error_message: opts.errorMessage ?? null,
      details: opts.details ?? null,
    });
  } catch (_) {
    // Volontairement silencieux : la télémétrie ne doit pas casser la tâche.
  }
}

/**
 * Wrap une fonction CRON et logge automatiquement succès / erreur + durée.
 * Utilisation :
 *   return await withCronLogging('post-daily-updates', async () => { ...code... });
 */
export async function withCronLogging<T>(
  jobName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const details =
      result && typeof result === 'object' ? (result as Details) : null;
    await logCronRun(jobName, 'success', {
      durationMs: Date.now() - start,
      details,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logCronRun(jobName, 'error', {
      durationMs: Date.now() - start,
      errorMessage: message.slice(0, 2000),
    });
    throw err;
  }
}
