import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { deductCredits } from './useCredits';
import { toast } from 'sonner';

const BOOST_COST = 10.0;
const BOOST_DURATION_HOURS = 24;

export const useProfileBoost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has an active boost
  const { data: activeBoost, isLoading: boostLoading } = useQuery({
    queryKey: ['profile-boost', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profile_boosts')
        .select('*')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Activate boost
  const boostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Non authentifié');

      // Deduct credits
      const result = await deductCredits(user.id, BOOST_COST, 'profile_boost', 'Mise en avant du profil 24h');
      if (!result.success) {
        throw new Error(result.error || 'Crédits insuffisants');
      }

      const expiresAt = new Date(Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profile_boosts')
        .insert({
          user_id: user.id,
          credits_spent: BOOST_COST,
          expires_at: expiresAt,
          max_views: 3,
          views_delivered: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-boost', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-credits', user?.id] });
      toast.success('🚀 Profil mis en avant !', {
        description: 'Ton profil sera visible par d\'autres pendant 24h.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });

  return {
    activeBoost,
    isBoostActive: !!activeBoost,
    boostLoading,
    activateBoost: boostMutation.mutate,
    isActivating: boostMutation.isPending,
    boostCost: BOOST_COST,
    boostExpiresAt: activeBoost?.expires_at ? new Date(activeBoost.expires_at) : null,
  };
};

// Hook to fetch boosted profiles for the swipe feed
export const useBoostedProfiles = () => {
  const { user } = useAuth();

  const { data: boostedProfiles = [] } = useQuery({
    queryKey: ['boosted-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('profile_boosts')
        .select('user_id, id, views_delivered, max_views')
        .gte('expires_at', new Date().toISOString())
        .neq('user_id', user.id)
        .lt('views_delivered', 3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Increment view count when a boosted profile is shown
  const recordBoostView = async (boostId: string) => {
    await supabase
      .from('profile_boosts')
      .update({ views_delivered: (await supabase.from('profile_boosts').select('views_delivered').eq('id', boostId).single()).data?.views_delivered + 1 || 1 })
      .eq('id', boostId);
  };

  return { boostedProfiles, recordBoostView };
};
