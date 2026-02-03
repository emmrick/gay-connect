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
      // A member is truly online if is_online = true AND last_seen within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_seen', fiveMinutesAgo);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every 1 minute
  });
};
