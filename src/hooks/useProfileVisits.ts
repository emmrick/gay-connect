import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback, useMemo } from 'react';
import { getSignedAvatarUrl } from '@/hooks/useAvatarUrl';

interface ProfileVisit {
  id: string;
  visitor_user_id: string;
  visited_at: string;
  visitor_username: string;
  visitor_avatar: string | null;
  visitor_age: number | null;
}

const VISITS_SEEN_KEY = 'visits_last_seen_at';

function getLastSeenAt(userId: string): string | null {
  try {
    return localStorage.getItem(`${VISITS_SEEN_KEY}_${userId}`);
  } catch {
    return null;
  }
}

function setLastSeenAt(userId: string) {
  try {
    localStorage.setItem(`${VISITS_SEEN_KEY}_${userId}`, new Date().toISOString());
  } catch {}
}

export const useProfileVisits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile-visits', user?.id],
    queryFn: async (): Promise<ProfileVisit[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('profile_visits')
        .select('id, visitor_user_id, visited_at')
        .eq('visited_user_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(100);

      if (error || !data) return [];

      // Fetch visitor profiles
      const visitorIds = data.map(v => v.visitor_user_id);
      if (visitorIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, age')
        .in('user_id', visitorIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      // Sign avatar URLs
      const results = await Promise.all(data.map(async visit => {
        const profile = profileMap.get(visit.visitor_user_id);
        const signedAvatar = profile?.avatar_url ? await getSignedAvatarUrl(profile.avatar_url) : null;
        return {
          id: visit.id,
          visitor_user_id: visit.visitor_user_id,
          visited_at: visit.visited_at,
          visitor_username: profile?.username || 'Anonyme',
          visitor_avatar: signedAvatar,
          visitor_age: profile?.age || null,
        };
      }));
      return results;
    },
    enabled: !!user?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-visits-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_visits',
          filter: `visited_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profile-visits', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

/** Returns the count of unread visits (since the user last opened the Visits tab) */
export const useUnreadVisitsCount = () => {
  const { user } = useAuth();
  const { data: visits } = useProfileVisits();

  const unreadCount = useMemo(() => {
    if (!user?.id || !visits?.length) return 0;
    const lastSeen = getLastSeenAt(user.id);
    if (!lastSeen) return visits.length; // Never opened → all are new
    return visits.filter(v => new Date(v.visited_at) > new Date(lastSeen)).length;
  }, [user?.id, visits]);

  return unreadCount;
};

/** Mark all visits as seen (call when user opens the Visits tab) */
export const useMarkVisitsSeen = () => {
  const { user } = useAuth();

  return useCallback(() => {
    if (user?.id) {
      setLastSeenAt(user.id);
    }
  }, [user?.id]);
};

export const useRecordProfileVisit = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (visitedUserId: string) => {
      if (!user?.id || user.id === visitedUserId) return;

      await supabase
        .from('profile_visits')
        .upsert(
          {
            visitor_user_id: user.id,
            visited_user_id: visitedUserId,
            visited_at: new Date().toISOString(),
          },
          { onConflict: 'visited_user_id,visitor_user_id' }
        );
    },
  });
};
