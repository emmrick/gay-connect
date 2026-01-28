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
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
