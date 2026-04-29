import { useMemo } from 'react';
import { Calendar, Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

/**
 * Monthly free credits status card.
 *
 * Shows clearly:
 *  - Remaining free credits this 30-day period (cap = 25 = 5 days × 5 credits)
 *  - Exact reset date (30 days after the start of the current sliding window)
 *  - Countdown (days remaining)
 *  - Animated progress bar
 *
 * Reads `weekly_credits_given` / `weekly_reset_date` from `get_user_credit_balance`
 * (kept for backward compat — they now represent the 30-day monthly window).
 */
const MONTHLY_CAP = 25; // 5 jours offerts × 5 crédits / jour
const WINDOW_DAYS = 30;

const MonthlyFreeCreditsCard = () => {
  const { credits, isLoading } = useCredits();

  const { given, remaining, percent, resetDate, daysLeft, hoursLeft } = useMemo(() => {
    const givenRaw = (credits as any)?.weekly_credits_given ?? 0;
    const given = Math.max(0, Math.min(MONTHLY_CAP, Number(givenRaw) || 0));
    const remaining = Math.max(0, MONTHLY_CAP - given);
    const percent = Math.min(100, (given / MONTHLY_CAP) * 100);

    const resetStartStr: string | null =
      (credits as any)?.monthly_reset_date ??
      (credits as any)?.weekly_reset_date ??
      null;

    let resetDate: Date | null = null;
    let daysLeft = 0;
    let hoursLeft = 0;
    if (resetStartStr) {
      const start = new Date(resetStartStr);
      resetDate = new Date(start);
      resetDate.setDate(resetDate.getDate() + WINDOW_DAYS);
      const ms = resetDate.getTime() - Date.now();
      if (ms > 0) {
        daysLeft = Math.floor(ms / 86_400_000);
        hoursLeft = Math.max(0, Math.floor((ms % 86_400_000) / 3_600_000));
      }
    }

    return { given, remaining, percent, resetDate, daysLeft, hoursLeft };
  }, [credits]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-4 animate-pulse h-32" />
    );
  }

  const resetLabel = resetDate
    ? resetDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const isEmpty = remaining <= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5',
        isEmpty
          ? 'border-amber-500/25 bg-amber-500/5'
          : 'border-emerald-500/20 bg-emerald-500/5'
      )}
      aria-label="Crédits gratuits mensuels restants"
    >
      {/* Decorative glow */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none',
          isEmpty ? 'bg-amber-500/15' : 'bg-emerald-500/15'
        )}
      />

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isEmpty ? 'bg-amber-500/15' : 'bg-emerald-500/15'
          )}
        >
          <Gift className={cn('w-5 h-5', isEmpty ? 'text-amber-500' : 'text-emerald-500')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-bold font-heading text-foreground">
              Crédits gratuits du mois
            </p>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                isEmpty
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              )}
            >
              {WINDOW_DAYS} jours
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-snug">
            5 crédits offerts par jour, dans la limite de{' '}
            <strong className="text-foreground">{MONTHLY_CAP} crédits</strong> par période de{' '}
            {WINDOW_DAYS} jours.
          </p>

          {/* Big counter */}
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={remaining}
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className={cn(
                'text-3xl font-heading font-extrabold tabular-nums',
                isEmpty ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {remaining.toFixed(1)}
            </motion.span>
            <span className="text-xs text-muted-foreground">
              / {MONTHLY_CAP} crédits restants
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mt-2 h-2 rounded-full bg-foreground/5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression de la consommation des crédits gratuits"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'h-full rounded-full',
                isEmpty
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              )}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {given.toFixed(1)} utilisés
            </span>
            <span>{Math.round(percent)}%</span>
          </div>

          {/* Reset info */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0 text-[11px] leading-snug">
              <span className="text-muted-foreground">Prochaine réinitialisation : </span>
              <strong className="text-foreground">{resetLabel}</strong>
              {resetDate && daysLeft + hoursLeft > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · dans{' '}
                  {daysLeft > 0
                    ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
                    : `${hoursLeft} h`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default MonthlyFreeCreditsCard;
