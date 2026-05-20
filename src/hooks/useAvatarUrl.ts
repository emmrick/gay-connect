import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY = 3600; // 1 hour
const CACHE_TTL = 50 * 60 * 1000; // 50 minutes (refresh before expiry)

// Global in-memory cache for signed avatar URLs
const avatarCache = new Map<string, { url: string; expiresAt: number }>();
// In-flight dedup: when the same path is requested twice in parallel
// (e.g. parent grid pre-signs while cards mount), share the same promise.
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Extract storage path from a full Supabase URL or raw path
 */
function extractAvatarPath(avatarUrl: string): string | null {
  if (!avatarUrl) return null;

  // Strip query params before extracting path
  const cleanUrl = avatarUrl.split('?')[0];

  // Signed URL — extract path so we can re-sign it (tokens expire)
  const signedMatch = cleanUrl.match(/\/storage\/v1\/object\/sign\/avatars\/(.+)/);
  if (signedMatch) return signedMatch[1];

  // Full public URL: extract path after bucket name
  const publicMatch = cleanUrl.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
  if (publicMatch) return publicMatch[1];

  // Raw path (e.g. "uuid/file.jpg") — also strip query params
  if (!avatarUrl.startsWith('http')) return avatarUrl.split('?')[0];

  return null;
}

function getCached(path: string): string | null {
  const cached = avatarCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  return null;
}

function setCached(path: string, url: string) {
  avatarCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL });
}

/**
 * Get a signed avatar URL with in-memory caching + in-flight dedup.
 * Returns the original URL if it can't be resolved.
 */
export async function getSignedAvatarUrl(avatarUrl: string | null | undefined): Promise<string | null> {
  if (!avatarUrl) return null;

  const path = extractAvatarPath(avatarUrl);
  if (!path) return avatarUrl;

  const cached = getCached(path);
  if (cached) return cached;

  const existing = inFlight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, SIGNED_URL_EXPIRY);

      if (error || !data?.signedUrl) {
        console.warn('Failed to sign avatar URL:', path, error?.message);
        return avatarUrl;
      }
      setCached(path, data.signedUrl);
      return data.signedUrl;
    } catch (e) {
      console.warn('Error signing avatar URL:', path, e);
      return avatarUrl;
    } finally {
      inFlight.delete(path);
    }
  })();
  inFlight.set(path, promise);
  return promise;
}

/**
 * Batch-resolve multiple avatar URLs using Supabase's createSignedUrls
 * (one round-trip instead of N). Falls back transparently to single signing.
 */
export async function getSignedAvatarUrls(
  avatarUrls: (string | null | undefined)[]
): Promise<(string | null)[]> {
  // Map index → resolved value as we go
  const out: (string | null)[] = new Array(avatarUrls.length).fill(null);
  const pendingByPath: Map<string, number[]> = new Map();
  const originalByIdx: (string | null | undefined)[] = avatarUrls;

  avatarUrls.forEach((u, idx) => {
    if (!u) { out[idx] = null; return; }
    const path = extractAvatarPath(u);
    if (!path) { out[idx] = u; return; }
    const cached = getCached(path);
    if (cached) { out[idx] = cached; return; }
    const arr = pendingByPath.get(path) ?? [];
    arr.push(idx);
    pendingByPath.set(path, arr);
  });

  const paths = Array.from(pendingByPath.keys());
  if (paths.length === 0) return out;

  // Reuse any in-flight promise for paths that already have one
  const stillToFetch: string[] = [];
  const inFlightPromises: Promise<void>[] = [];
  for (const p of paths) {
    const existing = inFlight.get(p);
    if (existing) {
      inFlightPromises.push(
        existing.then((url) => {
          const indices = pendingByPath.get(p) ?? [];
          indices.forEach((i) => { out[i] = url ?? originalByIdx[i] ?? null; });
        })
      );
    } else {
      stillToFetch.push(p);
    }
  }

  if (stillToFetch.length > 0) {
    // One big createSignedUrls request, deduped via inFlight per path
    const batchPromise = (async () => {
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrls(stillToFetch, SIGNED_URL_EXPIRY);
        if (error || !data) {
          console.warn('Batch sign failed, falling back per-url:', error?.message);
          // Fallback: sign individually (will reuse inFlight + cache)
          await Promise.all(stillToFetch.map((p) => {
            const indices = pendingByPath.get(p) ?? [];
            const firstIdx = indices[0];
            const original = firstIdx != null ? originalByIdx[firstIdx] ?? null : null;
            return getSignedAvatarUrl(original).then((url) => {
              indices.forEach((i) => { out[i] = url ?? originalByIdx[i] ?? null; });
            });
          }));
          return;
        }
        const byPath = new Map<string, string | null>();
        data.forEach((r: any) => {
          if (r?.path && r.signedUrl) byPath.set(r.path, r.signedUrl);
        });
        for (const p of stillToFetch) {
          const url = byPath.get(p) ?? null;
          if (url) setCached(p, url);
          const indices = pendingByPath.get(p) ?? [];
          indices.forEach((i) => {
            out[i] = url ?? originalByIdx[i] ?? null;
          });
        }
      } catch (e) {
        console.warn('Batch sign error:', e);
      }
    })();
    // Register batch in inFlight per path so concurrent single-getters reuse it
    stillToFetch.forEach((p) => {
      const wrapper = batchPromise.then(() => getCached(p) ?? null);
      inFlight.set(p, wrapper);
      wrapper.finally(() => {
        // Only clear if still ours
        if (inFlight.get(p) === wrapper) inFlight.delete(p);
      });
    });
    inFlightPromises.push(batchPromise);
  }

  await Promise.all(inFlightPromises);
  return out;
}

/**
 * React hook that resolves an avatar_url to a signed URL.
 * Caches results in memory to minimize storage API calls.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(() => {
    if (!avatarUrl) return null;
    const path = extractAvatarPath(avatarUrl);
    if (!path) return avatarUrl;
    return getCached(path);
  });
  const urlRef = useRef(avatarUrl);

  useEffect(() => {
    urlRef.current = avatarUrl;
    if (!avatarUrl) {
      setSignedUrl(null);
      return;
    }

    const path = extractAvatarPath(avatarUrl);
    if (!path) {
      setSignedUrl(avatarUrl);
      return;
    }

    const cached = getCached(path);
    if (cached) {
      setSignedUrl(cached);
      return;
    }

    getSignedAvatarUrl(avatarUrl).then((url) => {
      if (urlRef.current === avatarUrl) {
        setSignedUrl(url);
      }
    });
  }, [avatarUrl]);

  return signedUrl;
}
