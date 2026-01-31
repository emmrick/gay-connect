import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that subscribes to real-time online status changes for all users.
 * Automatically invalidates relevant queries when a user's status changes.
 */
export const useRealtimeOnlineStatus = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-online-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const { old: oldData, new: newData } = payload;
          
          // Only react to online status or last_seen changes
          if (oldData?.is_online !== newData?.is_online || oldData?.last_seen !== newData?.last_seen) {
            const userId = newData?.user_id;
            
            // Invalidate specific profile query
            if (userId) {
              queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            }
            
            // Invalidate global online counts
            queryClient.invalidateQueries({ queryKey: ['online-member-counts'] });
            
            // Invalidate profiles by region
            if (newData?.region) {
              queryClient.invalidateQueries({ queryKey: ['profiles', 'region', newData.region] });
            }
            
            // Invalidate nearby profiles
            queryClient.invalidateQueries({ queryKey: ['nearby-profiles'] });
            
            // Invalidate private conversations to update status indicators
            queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook to subscribe to a specific user's online status changes
 */
export const useRealtimeUserOnlineStatus = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { old: oldData, new: newData } = payload;
          
          if (oldData?.is_online !== newData?.is_online || oldData?.last_seen !== newData?.last_seen) {
            // Invalidate this specific profile
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
