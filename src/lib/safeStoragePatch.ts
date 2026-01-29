/**
 * Patch de sécurité pour éviter les écrans noirs liés à des exceptions localStorage.
 *
 * Cas observés (souvent Safari / mode privé / restrictions):
 * - localStorage.setItem/getItem peut throw (QuotaExceededError / SecurityError)
 * - certains SDKs (dont l'auth) crashent si ces exceptions ne sont pas catchées
 *
 * Stratégie:
 * - tenter localStorage
 * - si échec, fallback sur sessionStorage
 * - si échec, fallback mémoire (non persistant mais évite le crash)
 */

const isBrowser = typeof window !== "undefined";

type StorageMethod = (key: string, value?: string) => any;

export function patchSafeStorage() {
  if (!isBrowser) return;

  // Certains environnements n'exposent pas Storage
  if (typeof Storage === "undefined" || !Storage.prototype) return;

  const proto = Storage.prototype as unknown as {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  };

  const original = {
    getItem: proto.getItem,
    setItem: proto.setItem,
    removeItem: proto.removeItem,
    clear: proto.clear,
  };

  // Évite double patch
  if ((proto as any).__safeStoragePatched) return;

  const memory = new Map<string, string>();

  const tryGet = (storage: Storage | null | undefined, key: string): string | null => {
    if (!storage) return null;
    try {
      // On appelle la méthode originale pour éviter la récursion si sessionStorage est aussi patché
      return original.getItem.call(storage, key);
    } catch {
      return null;
    }
  };

  const trySet = (storage: Storage | null | undefined, key: string, value: string): boolean => {
    if (!storage) return false;
    try {
      original.setItem.call(storage, key, value);
      return true;
    } catch {
      return false;
    }
  };

  const tryRemove = (storage: Storage | null | undefined, key: string): boolean => {
    if (!storage) return false;
    try {
      original.removeItem.call(storage, key);
      return true;
    } catch {
      return false;
    }
  };

  proto.getItem = function safeGetItem(key: string) {
    // 1) localStorage/sessionStorage natif
    try {
      const v = original.getItem.call(this as any, key);
      if (v !== null) return v;
    } catch {
      // ignore
    }

    // 2) si l'appel vient de localStorage, fallback sessionStorage
    if (isBrowser) {
      try {
        if (this === window.localStorage) {
          const v = tryGet(window.sessionStorage, key);
          if (v !== null) return v;
        }
      } catch {
        // ignore
      }
    }

    // 3) mémoire
    return memory.get(key) ?? null;
  };

  proto.setItem = function safeSetItem(key: string, value: string) {
    // 1) tente natif
    try {
      original.setItem.call(this as any, key, value);
      return;
    } catch {
      // ignore
    }

    // 2) fallback sessionStorage si on était sur localStorage
    if (isBrowser) {
      try {
        if (this === window.localStorage && trySet(window.sessionStorage, key, value)) return;
      } catch {
        // ignore
      }
    }

    // 3) mémoire
    memory.set(key, String(value));
  };

  proto.removeItem = function safeRemoveItem(key: string) {
    // 1) tente natif
    try {
      original.removeItem.call(this as any, key);
      memory.delete(key);
      return;
    } catch {
      // ignore
    }

    // 2) fallback sessionStorage si on était sur localStorage
    if (isBrowser) {
      try {
        if (this === window.localStorage) {
          tryRemove(window.sessionStorage, key);
        }
      } catch {
        // ignore
      }
    }

    // 3) mémoire
    memory.delete(key);
  };

  proto.clear = function safeClear() {
    try {
      original.clear.call(this as any);
    } catch {
      // ignore
    }
    memory.clear();
  };

  (proto as any).__safeStoragePatched = true;
}

// Exécuter immédiatement au chargement du module
patchSafeStorage();
