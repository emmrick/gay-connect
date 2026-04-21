/**
 * Préchargement des chunks lazy-loaded des pages principales.
 * Les imports dynamiques sont mis en cache par Vite/le navigateur,
 * donc une fois préchargés, la navigation devient quasi-instantanée
 * (pas de re-téléchargement, pas de "Loader2" en plein écran).
 */

const loaders: Record<string, () => Promise<unknown>> = {
  home: () => import('@/pages/HomePage'),
  swipe: () => import('@/pages/SwipePageRoute'),
  messages: () => import('@/pages/MessagesPage'),
  tween: () => import('@/pages/TweenPageRoute'),
  help: () => import('@/pages/HelpPageRoute'),
  profile: () => import('@/pages/ProfilePage'),
  credits: () => import('@/pages/CreditsPageRoute'),
  privateChat: () => import('@/pages/PrivateChatPage'),
  groupChat: () => import('@/pages/GroupChatPage'),
};

const prefetched = new Set<string>();

export const prefetchRoute = (key: keyof typeof loaders) => {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  // Fire-and-forget: si ça échoue, on retentera la prochaine fois.
  loaders[key]?.().catch(() => prefetched.delete(key));
};

/**
 * Précharge en arrière-plan toutes les pages principales de la nav.
 * À appeler après le premier rendu (idle) pour ne pas retarder le LCP.
 */
export const prefetchMainRoutes = () => {
  const run = () => {
    prefetchRoute('home');
    prefetchRoute('messages');
    prefetchRoute('tween');
    prefetchRoute('swipe');
    prefetchRoute('help');
    prefetchRoute('profile');
  };
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 1500);
  }
};
