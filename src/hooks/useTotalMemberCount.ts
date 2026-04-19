import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTotalMemberCount = () => {
  return useQuery({
    queryKey: ['total-member-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000, // 1 minute
  });
};

export const useOnlineMemberCount = () => {
  return useQuery({
    queryKey: ['online-member-count'],
    queryFn: async (): Promise<number> => {
      // Nettoyer d'abord les profils "fantômes" (is_online=true mais inactifs)
      try {
        await supabase.rpc('cleanup_stale_online_profiles');
      } catch {
        // Échec silencieux : la requête suivante filtre quand même par last_seen
      }

      // Un membre est réellement en ligne si is_online = true ET last_seen dans les 5 dernières minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_seen', fiveMinutesAgo);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
    refetchInterval: 30000, // Rafraîchit toutes les 30s pour un compteur réellement vivant
    refetchOnWindowFocus: true,
  });
};
