import { motion } from 'framer-motion';
import { Lock, Sparkles, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import type { ReferralMilestone } from '@/hooks/useReferralMilestones';
import { cn } from '@/lib/utils';

interface ReferralMilestonesTrackProps {
  milestones: ReferralMilestone[];
  unlockedIds: Set<string>;
  verifiedCount: number;
}

/**
 * Gamified milestone track:
 * - XP-style progress bar from current verified count toward the next milestone
 * - Visual chip for each milestone (unlocked / next / locked)
 */
const ReferralMilestonesTrack = ({ milestones, unlockedIds, verifiedCount }: ReferralMilestonesTrackProps) => {
  const sorted = useMemo(() => [...milestones].sort((a, b) => a.threshold - b.threshold), [milestones]);

  const nextMilestone = sorted.find((m) => verifiedCount < m.threshold) ?? sorted[sorted.length - 1];
  const previousThreshold = sorted
    .filter((m) => m.threshold <= verifiedCount)
    .reduce((max, m) => Math.max(max, m.threshold), 0);

  const segmentSpan = Math.max(1, (nextMilestone?.threshold ?? 1) - previousThreshold);
  const segmentProgress = Math.min(verifiedCount - previousThreshold, segmentSpan);
  const percent = Math.min(100, Math.max(0, (segmentProgress / segmentSpan) * 100));

  const reachedAll = sorted.length > 0 && verifiedCount >= sorted[sorted.length - 1].threshold;

  return (
    <div className="space-y-3">
      {/* Progress to next milestone */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-amber-500/5 to-pink-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Progression
            </span>
          </div>
          {reachedAll ? (
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Tous débloqués !
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{verifiedCount}</span>
              <span className="mx-1">/</span>
              <span className="font-bold text-primary">{nextMilestone?.threshold}</span> filleuls vérifiés
            </span>
          )}
        </div>

        {!reachedAll && (
          <>
            <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden border border-border/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(90deg, hsl(45 100% 55%), hsl(15 100% 55%), hsl(330 100% 60%))',
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                />
              </motion.div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Plus que <span className="font-bold text-foreground">
                {Math.max(0, (nextMilestone?.threshold ?? 0) - verifiedCount)}
              </span> filleul(s) pour débloquer{' '}
              <span className="font-bold text-foreground">
                {nextMilestone?.badge_emoji} {nextMilestone?.label}
              </span>
              {nextMilestone && nextMilestone.bonus_credits > 0 && (
                <> et <span className="font-bold text-amber-600 dark:text-amber-400">+{nextMilestone.bonus_credits} crédits bonus</span></>
              )}
              .
            </p>
          </>
        )}
      </div>

      {/* Milestones grid */}
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((m, i) => {
          const unlocked = unlockedIds.has(m.id) || verifiedCount >= m.threshold;
          const isNext = !unlocked && nextMilestone?.id === m.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={cn(
                'relative rounded-xl border p-2.5 text-center transition-all',
                unlocked
                  ? 'border-primary/30 bg-gradient-to-br from-primary/15 to-amber-500/10 shadow-sm'
                  : isNext
                    ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-border/40 bg-muted/30 opacity-70'
              )}
            >
              <div className={cn('text-2xl mb-0.5', !unlocked && !isNext && 'grayscale opacity-60')}>
                {m.badge_emoji}
              </div>
              <div className="text-[10px] font-bold leading-tight truncate">{m.label}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {m.threshold} filleul{m.threshold > 1 ? 's' : ''}
              </div>
              {m.bonus_credits > 0 && (
                <div
                  className={cn(
                    'text-[9px] font-bold mt-0.5',
                    unlocked ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  +{m.bonus_credits} cr.
                </div>
              )}
              {!unlocked && !isNext && (
                <Lock className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-muted-foreground" />
              )}
              {unlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
                  ✓
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReferralMilestonesTrack;
