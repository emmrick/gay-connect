import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CreditBalanceProgressProps {
  current: number;
  max: number;
  isPromoActive: boolean;
}

/**
 * Animated progress bar for credit balance.
 * - Normal: Smooth gradient fill with subtle shimmer
 * - Promo active: Vibrant animated gradient + pulse + extra shimmer
 */
const CreditBalanceProgress = ({ current, max, isPromoActive }: CreditBalanceProgressProps) => {
  const percent = useMemo(() => {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }, [current, max]);

  return (
    <div className="space-y-1.5 mb-3">
      {/* Bar */}
      <div
        className={cn(
          'relative h-2.5 rounded-full overflow-hidden border',
          isPromoActive
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-border/40 bg-muted/40'
        )}
      >
        {/* Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full rounded-full overflow-hidden"
          style={{
            background: isPromoActive
              ? 'linear-gradient(90deg, hsl(45 100% 55%), hsl(15 100% 55%), hsl(330 100% 60%))'
              : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
          }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: isPromoActive ? 1.2 : 2.5,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: isPromoActive ? 0 : 1.5,
            }}
          />

          {/* Promo extra pulse */}
          {isPromoActive && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-[10px] font-medium">
        <span className="text-muted-foreground/70">
          {percent.toFixed(0)}% du record
        </span>
        <span className={cn('tabular-nums', isPromoActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-muted-foreground/70')}>
          {current.toFixed(1)} / {max.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

export default CreditBalanceProgress;
