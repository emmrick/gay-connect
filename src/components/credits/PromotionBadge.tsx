import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Flame } from 'lucide-react';
import { ActivePromotion } from '@/hooks/useActivePromotion';

interface PromotionBadgeProps {
  promotion: ActivePromotion;
}

const formatTimeLeft = (endsAt: string): string => {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 'Expirée';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}j ${hours}h restant${days > 1 ? 'es' : 'e'}`;
  if (hours > 0) return `${hours}h ${minutes}min restant${hours > 1 ? 'es' : 'e'}`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
};

const PromotionBadge = ({ promotion }: PromotionBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(promotion.ends_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(promotion.ends_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [promotion.ends_at]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 mb-3"
      style={{
        background: 'linear-gradient(135deg, hsl(45 100% 50% / 0.15), hsl(15 100% 55% / 0.12), hsl(330 100% 60% / 0.10))',
      }}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.25), transparent)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative flex items-center gap-3 px-3 py-2.5">
        {/* Animated flame icon */}
        <motion.div
          animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
        >
          <Flame className="w-5 h-5 text-white" fill="currentColor" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Promo en cours
            </span>
          </div>
          <p className="text-sm font-bold text-foreground truncate leading-tight">
            -{promotion.discount_percent}% sur tes actions
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Big % */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex-shrink-0 text-2xl font-heading font-extrabold bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent"
        >
          -{promotion.discount_percent}%
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PromotionBadge;
