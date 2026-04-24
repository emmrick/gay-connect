import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns the date of the last successfully sent weekly-digest email
 * for the current authenticated user, plus the next scheduled run.
 * Cron schedule: every Monday at 07:00 UTC (~09:00 Paris).
 */
const NEXT_DIGEST_HOUR_UTC = 7;

const computeNextMondayUtc = (from: Date = new Date()): Date => {
  const d = new Date(from);
  d.setUTCHours(NEXT_DIGEST_HOUR_UTC, 0, 0, 0);
  // 1 = Monday in UTC
  const day = d.getUTCDay();
  let daysUntilMonday = (1 - day + 7) % 7;
  if (daysUntilMonday === 0 && from.getTime() >= d.getTime()) {
    daysUntilMonday = 7;
  }
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d;
};

export const useWeeklyDigestStatus = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['weekly-digest-last-sent', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_my_last_weekly_digest_sent_at');
      if (error) throw error;
      return (data as string | null) ?? null;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return {
    lastSentAt: query.data ?? null,
    nextScheduledAt: computeNextMondayUtc(),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
