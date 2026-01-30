export class TimeoutError extends Error {
  override name = 'TimeoutError';

  constructor(message = 'REQUEST_TIMEOUT') {
    super(message);
  }
}

export const withTimeout = async <T>(
  promise: PromiseLike<T>,
  ms: number,
  message = 'REQUEST_TIMEOUT'
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new TimeoutError(message)), ms);
  });

  try {
    // Supabase builders are PromiseLike (thenable) but not always typed as Promise.
    // Promise.resolve normalizes them into a real Promise for Promise.race.
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
