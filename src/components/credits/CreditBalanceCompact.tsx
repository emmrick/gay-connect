import { Coins, AlertTriangle, TrendingDown } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { useCreditDialog } from '@/contexts/CreditDialogContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CreditBalanceCompactProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Compact credit balance display for header/navigation
 * Shows total credits with a small visual indicator
 * When credits are at 0, clicking shows the insufficient credits dialog
 * Animates when credits are deducted
 */
const CreditBalanceCompact = ({ className, onClick }: CreditBalanceCompactProps) => {
  const { totalCredits, isLoading } = useCredits();
  const { showInsufficientCreditsDialog } = useCreditDialog();
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductedAmount, setDeductedAmount] = useState<number | null>(null);
  const previousCredits = useRef<number | null>(null);

  // Detect credit deduction and trigger animation
  useEffect(() => {
    if (previousCredits.current !== null && totalCredits < previousCredits.current) {
      const amount = previousCredits.current - totalCredits;
      setDeductedAmount(amount);
      setIsDeducting(true);
      
      // Reset animation after delay
      const timer = setTimeout(() => {
        setIsDeducting(false);
        setDeductedAmount(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    previousCredits.current = totalCredits;
  }, [totalCredits]);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted", className)}>
        <div className="w-4 h-4 rounded bg-muted-foreground/20" />
        <div className="w-8 h-3 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  const isOutOfCredits = totalCredits <= 0;

  // Determine color based on credit amount
  const getCreditColor = () => {
    if (isDeducting) return 'text-amber-600 dark:text-amber-400 bg-amber-500/20 border-amber-500/40';
    if (isOutOfCredits) return 'text-destructive bg-destructive/10 border-destructive/30 animate-pulse';
    if (totalCredits <= 1) return 'text-destructive bg-destructive/10 border-destructive/20';
    if (totalCredits <= 5) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-primary bg-primary/10 border-primary/20';
  };

  const handleClick = () => {
    if (isOutOfCredits) {
      showInsufficientCreditsDialog(0.1, 'Utiliser le site');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
        animate={isDeducting ? { 
          scale: [1, 1.1, 0.95, 1],
          transition: { duration: 0.4 }
        } : {}}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all",
          "hover:shadow-md active:shadow-sm cursor-pointer",
          getCreditColor(),
          className
        )}
      >
        {isOutOfCredits ? (
          <AlertTriangle className="w-4 h-4" />
        ) : isDeducting ? (
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Coins className="w-4 h-4" />
          </motion.div>
        ) : (
          <Coins className="w-4 h-4" />
        )}
        <motion.span 
          key={totalCredits}
          initial={isDeducting ? { scale: 1.2, color: '#f59e0b' } : false}
          animate={{ scale: 1, color: 'inherit' }}
          className="text-xs font-semibold tabular-nums"
        >
          {totalCredits.toFixed(1)}
        </motion.span>
      </motion.button>

      {/* Floating deduction indicator */}
      <AnimatePresence>
        {isDeducting && deductedAmount !== null && (
          <motion.div
            initial={{ opacity: 0, y: 0, x: '-50%' }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-1 left-1/2 flex items-center gap-1 text-xs font-bold text-amber-500 pointer-events-none whitespace-nowrap"
          >
            <TrendingDown className="w-3 h-3" />
            <span>-{deductedAmount.toFixed(1)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditBalanceCompact;
