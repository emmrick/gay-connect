/**
 * Refactored Ratings panel — store-driven, modular cards.
 */
import { useEffect, useMemo } from 'react';
import { Star, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasksStore } from '@/stores/admin/useTasksStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionHeader, StatPill, EmptyState, LoadingList } from '../_shared/AdminAtoms';
import RatingCard from './RatingCard';

const EMOJI_ORDER = ['😡', '😕', '😐', '😊', '🤩'];

const RatingsPanel = () => {
  const { user } = useAuth();
  const { ratings, ratingsState, ratingsUsernames, fetchRatings } = useTasksStore();

  useEffect(() => {
    if (user?.id) fetchRatings(user.id);
  }, [user?.id, fetchRatings]);

  const stats = useMemo(() => {
    const counts = EMOJI_ORDER.map((e) => ({
      emoji: e,
      count: ratings.filter((r) => r.rating_emoji === e).length,
    }));
    const avg =
      ratings.length > 0
        ? (
            ratings.reduce((sum, r) => sum + EMOJI_ORDER.indexOf(r.rating_emoji) + 1, 0) /
            ratings.length
          ).toFixed(1)
        : '—';
    return { counts, avg };
  }, [ratings]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Star}
        title="Mes avis d'assistance"
        subtitle="Avis laissés par les clients après vos conversations de support"
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={() => user?.id && fetchRatings(user.id, { force: true })}
            disabled={ratingsState === 'loading'}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Rafraîchir
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Avis reçus" value={ratings.length} accent />
        <StatPill label="Score moyen /5" value={stats.avg} accent />
        {stats.counts.slice(0, 2).map(({ emoji, count }) => (
          <StatPill key={emoji} label={emoji} value={count} />
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {stats.counts.slice(2).map(({ emoji, count }) => (
          <StatPill key={emoji} label={emoji} value={count} />
        ))}
      </div>

      <ScrollArea className="h-[400px]">
        {ratingsState === 'loading' && ratings.length === 0 ? (
          <LoadingList rows={3} />
        ) : ratings.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Aucun avis reçu"
            description="Vos prochaines évaluations apparaîtront ici."
          />
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
              <RatingCard key={r.id} rating={r} username={ratingsUsernames[r.user_id]} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RatingsPanel;
