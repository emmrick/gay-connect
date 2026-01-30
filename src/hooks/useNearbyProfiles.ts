import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, FREE_LIMITS, PREMIUM_LIMITS } from './useSubscription';

interface NearbyProfile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  is_online: boolean | null;
  last_seen: string | null;
  region: string;
  distance_km: number | null;
}

export const useNearbyProfiles = (
  latitude: number | null,
  longitude: number | null,
  maxDistance: number = 100,
  limit: number = 50
) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  // Apply limit based on subscription status
  const effectiveLimit = isPremium 
    ? limit 
    : Math.min(limit, FREE_LIMITS.nearbyProfiles);

  // Calculate offline threshold based on subscription status
  // Premium users can see members offline up to 24 hours, free users only 1 hour
  const getOfflineThreshold = () => {
    return isPremium 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours for Premium
      : new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour for free
  };

  const query = useQuery({
    queryKey: ['nearby-profiles', latitude, longitude, maxDistance, effectiveLimit, isPremium],
    queryFn: async (): Promise<NearbyProfile[]> => {
      const offlineThreshold = getOfflineThreshold();

      // Use explicit null/undefined checks (0 is a valid coordinate).
      if (latitude == null || longitude == null) {
        // Fallback: get online profiles or recently active
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', user?.id || '')
          .or(`is_online.eq.true,last_seen.gte.${offlineThreshold}`)
          .order('is_online', { ascending: false })
          .order('last_seen', { ascending: false })
          .limit(effectiveLimit);

        if (error) throw error;
        
        return (data || []).map(profile => ({
          ...profile,
          distance_km: null,
        }));
      }

      // Use the nearby profiles function
      const { data, error } = await supabase
        .rpc('get_nearby_profiles', {
          user_lat: latitude,
          user_lon: longitude,
          max_distance_km: maxDistance,
          limit_count: effectiveLimit,
        });

      if (error) throw error;
      
      // Filter out users who are offline beyond the threshold
      const filteredData = (data || []).filter(profile => {
        if (profile.is_online) return true;
        if (!profile.last_seen) return false;
        return new Date(profile.last_seen) >= new Date(offlineThreshold);
      });
      
      return filteredData;
    },
    enabled: !!user,
    // Force refetch on mount/focus to ensure fresh data
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refresh every minute for fresher data
    staleTime: 0, // Always consider data stale to re-filter with current time
    gcTime: 60000, // Keep in cache for 1 minute only
  });

  const maxProfilesAllowed = isPremium 
    ? PREMIUM_LIMITS.nearbyProfiles 
    : FREE_LIMITS.nearbyProfiles;

  return {
    ...query,
    maxProfilesAllowed,
    isPremium,
    isLimited: !isPremium && (query.data?.length || 0) >= FREE_LIMITS.nearbyProfiles,
  };
};

export default useNearbyProfiles;
