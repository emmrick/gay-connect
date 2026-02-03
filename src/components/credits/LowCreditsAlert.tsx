import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Coins, X, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LOW_CREDITS_THRESHOLD = 2;
const STORAGE_KEY = 'low_credits_alert_dismissed_at';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Alert popup that shows when user's credit balance falls below threshold
 * Dismissable for 24 hours to avoid being annoying
 */
const LowCreditsAlert = () => {
  const { user } = useAuth();
  const { totalCredits, isLoading, canClaimDaily, claimDailyCredits } = useCredits();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Check if alert was recently dismissed
  const wasRecentlyDismissed = useCallback(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt) return false;
    
    const dismissedTime = parseInt(dismissedAt, 10);
    return Date.now() - dismissedTime < DISMISS_DURATION_MS;
  }, []);

  // Check conditions and show alert
  useEffect(() => {
    if (!user?.id || isLoading) return;
    
    // Only show if credits are low and not recently dismissed
    if (totalCredits < LOW_CREDITS_THRESHOLD && totalCredits >= 0 && !wasRecentlyDismissed()) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id, totalCredits, isLoading, wasRecentlyDismissed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  const handleClaimDaily = async () => {
    try {
      await claimDailyCredits.mutateAsync();
      setIsOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBuyCredits = () => {
    navigate('/?tab=credits');
    setIsOpen(false);
  };

  if (!user?.id) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5,
                delay: 0.3,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </motion.div>
          </motion.div>
          
          <AlertDialogTitle className="text-xl">
            Crédits faibles !
          </AlertDialogTitle>
          
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-foreground">
                {totalCredits.toFixed(1)}
              </span>
              <span className="text-muted-foreground">crédits restants</span>
            </div>
            
            <p className="text-sm">
              Votre solde de crédits est bas. Rechargez pour continuer à profiter de toutes les fonctionnalités.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {canClaimDaily && (
            <Button
              onClick={handleClaimDaily}
              disabled={claimDailyCredits.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              Réclamer 5 crédits gratuits
            </Button>
          )}
          
          <Button
            onClick={handleBuyCredits}
            variant="default"
            className="w-full"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Acheter des crédits
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Me rappeler plus tard
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LowCreditsAlert;
