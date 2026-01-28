import { useEffect, useCallback } from 'react';

interface UseMobileNavigationOptions {
  onBack?: () => void;
  enabled?: boolean;
}

export const useMobileNavigation = ({ onBack, enabled = true }: UseMobileNavigationOptions) => {
  // Handle hardware back button (Android/Browser)
  const handlePopState = useCallback((e: PopStateEvent) => {
    if (enabled && onBack) {
      e.preventDefault();
      onBack();
      // Push a new state to prevent actual navigation
      window.history.pushState(null, '', window.location.href);
    }
  }, [onBack, enabled]);

  useEffect(() => {
    if (!enabled || !onBack) return;

    // Push initial state to capture back button
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState, enabled, onBack]);

  // Swipe gesture detection
  useEffect(() => {
    if (!enabled || !onBack) return;

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
      
      // Check for right swipe from left edge (back gesture)
      if (
        touchStartX < 30 && // Started from left edge
        deltaX > minSwipeDistance && // Swiped right enough
        deltaY < maxVerticalMovement // Mostly horizontal
      ) {
        onBack();
      }
      
      // Reset values
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
  }, [enabled, onBack]);
};

export default useMobileNavigation;
