import { useEffect, useState } from 'react';

/**
 * Empêche un état "loading" de durer indéfiniment côté UI.
 * Utile quand le réseau/backend est instable et que la promesse ne se résout pas.
 */
export const useLoadingTimeout = (isLoading: boolean, timeoutMs = 15000) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    setTimedOut(false);
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [isLoading, timeoutMs]);

  return timedOut;
};
