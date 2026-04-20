import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Vérifie si l'utilisateur courant suit un membre donné + compteurs.
 */
export function useTweenFollowStatus(targetUserId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tween-follow-status', targetUserId, user?.id],
    queryFn: async () => {
      if (!targetUserId) return { isFollowing: false, followersCount: 0, followingCount: 0 };

      const [followingRes, followersRes, isFollowingRes] = await Promise.all([
        supabase.from('tween_follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
        supabase.from('tween_follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
        user
          ? supabase
              .from('tween_follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        isFollowing: !!isFollowingRes.data,
        followingCount: followingRes.count || 0,
        followersCount: followersRes.count || 0,
      };
    },
    enabled: !!targetUserId,
  });
}

/**
 * Toggle suivre / ne plus suivre un utilisateur.
 */
export function useToggleTweenFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Non connecté');
      if (user.id === targetUserId) throw new Error('Impossible de se suivre soi-même');

      if (isFollowing) {
        const { error } = await supabase
          .from('tween_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return { followed: false };
      }

      const { error } = await supabase
        .from('tween_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) throw error;
      return { followed: true };
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tween-follow-status', vars.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['tween-followers', vars.targetUserId] });
      toast.success(result.followed ? 'Tu suis ce membre' : 'Tu ne suis plus ce membre');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Action impossible');
    },
  });
}
