import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Signed URLs valid for 7 days (Supabase max). Combined with persistent
// localStorage cache, one signing round-trip lasts a whole week per user.
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const CACHE_TTL = 6 * 24 * 60 * 60 * 1000;  // 6 days (refresh before expiry)
const LS_KEY = 'avatar_url_cache_v1';

// Image transformation applied to all avatars. Renders a ~400x533 cover
// crop (matches the 3:4 cards) in WebP/AVIF (auto via Accept header).
// Cuts avatar bytes from ~1 MB to ~25 KB. Card hero gets a slightly
// larger variant via getSignedAvatarUrl(url, 'large').
const TRANSFORM_THUMB = { width: 400, height: 533, resize: 'cover' as const, quality: 65 };
const TRANSFORM_LARGE = { width: 720, height: 960, resize: 'cover' as const, quality: 72 };

type Variant = 'thumb' | 'large';

interface CacheEntry { url: string; expiresAt: number }

// Global in-memory cache for signed avatar URLs, keyed by `${path}|${variant}`.
const avatarCache = new Map<string, CacheEntry>();
// In-flight dedup: when the same key is requested twice in parallel
// (e.g. parent grid pre-signs while cards mount), share the same promise.
const inFlight = new Map<string, Promise<string | null>>();

// Hydrate from localStorage on module load (best-effort, swallow errors).
(() => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    Object.entries(parsed).forEach(([k, v]) => {
      if (v && typeof v.url === 'string' && typeof v.expiresAt === 'number' && v.expiresAt > now) {
        avatarCache.set(k, v);
      }
    });
  } catch {
    /* ignore */
  }
})();

// Debounced flush to localStorage (writes can be expensive on mobile).
let flushTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush() {
  if (typeof window === 'undefined') return;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      const obj: Record<string, CacheEntry> = {};
      const now = Date.now();
      avatarCache.forEach((v, k) => {
        if (v.expiresAt > now) obj[k] = v;
      });
      window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch {
      /* quota exceeded etc. — ignore */
    }
  }, 1500);
}

/**
 * Extract storage path from a full Supabase URL or raw path.
 * Handles signed, public AND render (transformed) URLs.
 */
function extractAvatarPath(avatarUrl: string): string | null {
  if (!avatarUrl) return null;

  const cleanUrl = avatarUrl.split('?')[0];

  // Transformed (render) URL — re-sign with the SAME transform
  const renderMatch = cleanUrl.match(/\/storage\/v1\/render\/image\/sign\/avatars\/(.+)/);
  if (renderMatch) return renderMatch[1];

  // Signed URL — token expires, we re-sign
  const signedMatch = cleanUrl.match(/\/storage\/v1\/object\/sign\/avatars\/(.+)/);
  if (signedMatch) return signedMatch[1];

  // Full public URL: extract path after bucket name
  const publicMatch = cleanUrl.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
  if (publicMatch) return publicMatch[1];

  // Raw path (e.g. "uuid/file.jpg")
  if (!avatarUrl.startsWith('http')) return avatarUrl.split('?')[0];

  return null;
}

function cacheKey(path: string, variant: Variant): string {
  return `${path}|${variant}`;
}

function getCached(path: string, variant: Variant): string | null {
  const cached = avatarCache.get(cacheKey(path, variant));
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  return null;
}

function setCached(path: string, variant: Variant, url: string) {
  avatarCache.set(cacheKey(path, variant), { url, expiresAt: Date.now() + CACHE_TTL });
  scheduleFlush();
}

/**
 * Get a transformed signed avatar URL with in-memory + localStorage cache
 * and in-flight dedup. Returns the original URL if it can't be resolved.
 */
export async function getSignedAvatarUrl(
  avatarUrl: string | null | undefined,
  variant: Variant = 'thumb'
): Promise<string | null> {
  if (!avatarUrl) return null;

  const path = extractAvatarPath(avatarUrl);
  if (!path) return avatarUrl;

  const cached = getCached(path, variant);
  if (cached) return cached;

  const key = cacheKey(path, variant);
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const transform = variant === 'large' ? TRANSFORM_LARGE : TRANSFORM_THUMB;
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, SIGNED_URL_EXPIRY, { transform });

      if (error || !data?.signedUrl) {
        console.warn('Failed to sign avatar URL:', path, error?.message);
        return avatarUrl;
      }
      setCached(path, variant, data.signedUrl);
      return data.signedUrl;
    } catch (e) {
      console.warn('Error signing avatar URL:', path, e);
      return avatarUrl;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}

/**
 * Resolve multiple avatar URLs in parallel, using cache + in-flight dedup.
 * (Supabase's createSignedUrls batch endpoint does NOT support transforms,
 * so we sign per-URL; HTTP/2 multiplexes the requests and the persistent
 * cache makes subsequent loads free.)
 */
export async function getSignedAvatarUrls(
  avatarUrls: (string | null | undefined)[],
  variant: Variant = 'thumb'
): Promise<(string | null)[]> {
  return Promise.all(avatarUrls.map((u) => getSignedAvatarUrl(u, variant)));
}

/**
 * React hook that resolves an avatar_url to a transformed signed URL.
 * Caches results in memory + localStorage to minimize storage API calls.
 */
export function useAvatarUrl(
  avatarUrl: string | null | undefined,
  variant: Variant = 'thumb'
): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(() => {
    if (!avatarUrl) return null;
    const path = extractAvatarPath(avatarUrl);
    if (!path) return avatarUrl;
    return getCached(path, variant);
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

    const cached = getCached(path, variant);
    if (cached) {
      setSignedUrl(cached);
      return;
    }

    getSignedAvatarUrl(avatarUrl, variant).then((url) => {
      if (urlRef.current === avatarUrl) {
        setSignedUrl(url);
      }
    });
  }, [avatarUrl, variant]);

  return signedUrl;
}
