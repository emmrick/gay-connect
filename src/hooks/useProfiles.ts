import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { supabaseQueryWithTimeout } from '@/lib/supabaseWithAbort';

type Profile = Tables<'profiles'>;

export const useProfilesByRegion = (region: string) => {
  return useQuery({
    queryKey: ['profiles', 'region', region],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('region', region)
        .order('is_online', { ascending: false })
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!region,
  });
};

export const useProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      
      const result = await supabaseQueryWithTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        8000 // 8s timeout for profile
      );

      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!userId,
    retry: 0,
    staleTime: 30000, // Cache 30s
  });
};
