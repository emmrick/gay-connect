import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Online member counts per region.
 * - Nettoie d'abord les profils fantômes (is_online=true mais last_seen > 5 min)
 * - Réagit en temps réel via useRealtimeProfileSync
 */
export const useOnlineMemberCounts = () => {
  return useQuery({
    queryKey: ['online-member-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      // Nettoyage des statuts "online" obsolètes
      try {
        await supabase.rpc('cleanup_stale_online_profiles');
      } catch {
        // silencieux
      }

      const recentThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .select('region')
        .eq('is_online', true)
        .gte('last_seen', recentThreshold);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((profile) => {
        if (profile.region) {
          counts[profile.region] = (counts[profile.region] || 0) + 1;
        }
      });

      return counts;
    },
    refetchInterval: 60_000, // 1 min
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};
