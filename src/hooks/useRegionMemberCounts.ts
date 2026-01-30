import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/withTimeout';

// Lightweight count for a specific region (avoids scanning all profiles every 30s)
export const useRegionMemberCount = (regionCode?: string | null, enabled = true) => {
  const query = useQuery({
    queryKey: ['region-member-count', regionCode],
    queryFn: async (): Promise<number> => {
      if (!regionCode) return 0;

      const { count, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('region', regionCode)
        ),
        12000
      );

      if (error) throw error;
      return count ?? 0;
    },
    enabled: enabled && !!regionCode,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    total: query.data ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
