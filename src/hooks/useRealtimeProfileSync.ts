import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * UNIFIED global realtime subscription for ALL profile changes.
 * Replaces useRealtimeOnlineStatus + useOnlineMemberCounts realtime + old useRealtimeProfileSync.
 * 
 * Mount ONCE at app level.
 */
export const useRealtimeProfileSync = () => {
  const queryClient = useQueryClient();
  const { user, refetchProfile } = useAuth();
  const lastInvalidateRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-profile-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const { old: oldData, new: newData } = payload;
          const changedUserId = newData?.user_id;

          const isAvatarChange = oldData?.avatar_url !== newData?.avatar_url;
          const isUsernameChange = oldData?.username !== newData?.username;
          const isBioChange = oldData?.bio !== newData?.bio;
          const isAgeChange = oldData?.age !== newData?.age;
          const isOnlineChange = oldData?.is_online !== newData?.is_online;
          const isProfileDataChange = isAvatarChange || isUsernameChange || isBioChange || isAgeChange;

          // Own profile data change → refresh AuthContext
          if (changedUserId === user.id && isProfileDataChange) {
            refetchProfile();
          }

          // Profile data changes (avatar, username, etc.) → invalidate profile-related queries
          if (isProfileDataChange) {
            // Update single profile cache directly instead of invalidating
            queryClient.setQueryData(['profile', changedUserId], (old: any) =>
              old ? { ...old, ...newData } : old
            );
            // Batch list invalidation with 10s debounce to avoid flicker
            const now = Date.now();
            if (now - lastInvalidateRef.current > 10000) {
              lastInvalidateRef.current = now;
              queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
              queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
            }
          }

          // Online status change → very lightweight, 30s throttle
          if (isOnlineChange && !isProfileDataChange) {
            const now = Date.now();
            if (now - lastInvalidateRef.current > 30000) {
              lastInvalidateRef.current = now;
              queryClient.invalidateQueries({ queryKey: ['online-member-counts'] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, refetchProfile]);
};
