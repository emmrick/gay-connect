import { supabase } from '@/integrations/supabase/client';

/**
 * Execute a Supabase query with a timeout that actually aborts the request.
 * This prevents "stuck loading" states when the network is slow.
 */
export async function fetchWithAbort<T>(
  queryFn: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: Error | null }>,
  timeoutMs = 12000
): Promise<{ data: T | null; error: Error | null }> {
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // Note: Supabase JS client doesn't natively support AbortSignal yet,
    // but we can still use Promise.race to enforce the timeout
    const result = await Promise.race([
      queryFn(signal),
      new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('TIMEOUT'));
        });
      }),
    ]);
    return result;
  } catch (err) {
    if (err instanceof Error && err.message === 'TIMEOUT') {
      return { data: null, error: new Error('La requête a pris trop de temps. Vérifie ta connexion.') };
    }
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Simple wrapper that converts a slow/hung request into an error after timeout.
 * More reliable than withTimeout for Supabase queries.
 */
export async function supabaseQueryWithTimeout<T>(
  queryPromise: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  timeoutMs = 12000
): Promise<{ data: T | null; error: { message: string } | null }> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({ 
        data: null, 
        error: { message: 'La requête a pris trop de temps. Vérifie ta connexion.' } 
      });
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
