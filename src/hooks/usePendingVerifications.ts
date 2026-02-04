import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePendingVerifications = () => {
  return useQuery({
    queryKey: ['pending-verifications-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('identity_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
