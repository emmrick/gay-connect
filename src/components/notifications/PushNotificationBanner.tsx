import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

const PushNotificationBanner = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if:
    // - User is logged in
    // - Push is supported
    // - Not already subscribed
    // - Permission not denied
    // - Banner not dismissed this session
    if (
      user &&
      isSupported &&
      !isSubscribed &&
      permission !== 'denied' &&
      !isDismissed
    ) {
      // Delay showing the banner
      const timer = setTimeout(() => {
        // Check localStorage to not show too often
        const lastDismissed = localStorage.getItem('push-banner-dismissed');
        if (lastDismissed) {
          const dismissedDate = new Date(lastDismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 7) {
            return; // Don't show if dismissed within last 7 days
          }
        }
        setShowBanner(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [user, isSupported, isSubscribed, permission, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem('push-banner-dismissed', new Date().toISOString());
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShowBanner(false);
    }
  };

  if (permission === 'denied') {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">
                  Activer les notifications ?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reçois des alertes même quand l'app est fermée : nouveaux messages, favoris, partages...
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={handleEnable}
                    disabled={isLoading}
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {isLoading ? 'Activation...' : 'Activer'}
                  </Button>
                  
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationBanner;
