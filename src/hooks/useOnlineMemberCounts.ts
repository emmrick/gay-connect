import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOnlineMemberCounts = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on profiles table
  useEffect(() => {
    const channel = supabase
      .channel('online-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          // Listen for changes to is_online or last_seen columns
        },
        (payload) => {
          const { old: oldData, new: newData } = payload;
          // Only invalidate if online status or last_seen changed
          if (oldData?.is_online !== newData?.is_online || oldData?.last_seen !== newData?.last_seen) {
            queryClient.invalidateQueries({ queryKey: ['online-member-counts'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['online-member-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      // Only count members who are marked online AND have been active in the last 5 minutes
      // This prevents counting stale "online" statuses from users who didn't properly disconnect
      const recentThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('region')
        .eq('is_online', true)
        .gte('last_seen', recentThreshold);

      if (error) throw error;

      // Count members per region
      const counts: Record<string, number> = {};
      data?.forEach((profile) => {
        counts[profile.region] = (counts[profile.region] || 0) + 1;
      });

      return counts;
    },
    refetchInterval: 60000,
    refetchOnMount: 'always',
    staleTime: 30000,
  });
};
