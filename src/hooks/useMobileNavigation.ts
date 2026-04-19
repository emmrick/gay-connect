import { useEffect, useCallback, useRef } from 'react';

interface UseMobileNavigationOptions {
  onBack?: () => void;
  enabled?: boolean;
  enableSwipeBack?: boolean;
}

/**
 * Mobile navigation hook:
 * - Intercepts hardware/browser back button via popstate
 * - Optional swipe-from-left-edge gesture
 * - Prevents the app from closing by always keeping a history entry
 */
export const useMobileNavigation = ({ 
  onBack, 
  enabled = true, 
  enableSwipeBack = true 
}: UseMobileNavigationOptions) => {
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!enabled || !onBack) return;

    // Push a sentinel state so pressing back triggers popstate instead of leaving.
    // On NE re-pousse PAS de sentinelle après chaque popstate : sinon l'historique
    // se remplit de sentinelles fantômes qui bloquent toute sortie ultérieure
    // (admin, autres pages…) et provoquent des "redirections" inattendues.
    if (!hasSetup.current) {
      window.history.pushState({ appGuard: true }, '', window.location.href);
      hasSetup.current = true;
    }

    const handlePopState = (e: PopStateEvent) => {
      onBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      hasSetup.current = false;
    };
  }, [onBack, enabled]);

  // Swipe gesture detection (left edge → right)
  useEffect(() => {
    if (!enabled || !onBack || !enableSwipeBack) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const minSwipeDistance = 80;
    const maxVerticalMovement = 100;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      if (
        touchStartX < 30 &&
        deltaX > minSwipeDistance &&
        deltaY < maxVerticalMovement
      ) {
        onBack();
      }
      
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onBack, enableSwipeBack]);
};

export default useMobileNavigation;
