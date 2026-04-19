import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReferralMilestone {
  id: string;
  threshold: number;
  bonus_credits: number;
  label: string;
  badge_emoji: string;
  description: string | null;
}

export interface UnlockedMilestone {
  milestone_id: string;
  unlocked_at: string;
  bonus_credited: number;
}

/**
 * Hook for the referral milestones system.
 * - Loads the global catalog of milestones
 * - Loads which ones the current user has unlocked
 * - Exposes a `claim` mutation that auto-attributes any milestone reached
 */
export const useReferralMilestones = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['referral-milestones'],
    queryFn: async (): Promise<ReferralMilestone[]> => {
      const { data, error } = await supabase
        .from('referral_milestones' as any)
        .select('*')
        .order('threshold', { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: unlocked = [], isLoading: loadingUnlocked } = useQuery({
    queryKey: ['user-referral-milestones', user?.id],
    queryFn: async (): Promise<UnlockedMilestone[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_referral_milestones' as any)
        .select('milestone_id, unlocked_at, bonus_credited')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const claim = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not authenticated');
      const { data, error } = await supabase.rpc('claim_referral_milestones' as any, {
        _user_id: user.id,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    onSuccess: (newly) => {
      if (Array.isArray(newly) && newly.length > 0) {
        newly.forEach((m: any) => {
          toast.success(`${m.badge_emoji} Palier débloqué : ${m.label}`, {
            description: m.bonus_credits > 0
              ? `+${m.bonus_credits} crédits bonus crédités !`
              : 'Bravo, continuez sur cette lancée !',
          });
        });
        qc.invalidateQueries({ queryKey: ['user-referral-milestones', user?.id] });
        qc.invalidateQueries({ queryKey: ['user-credits'] });
        qc.invalidateQueries({ queryKey: ['credit-transactions'] });
      }
    },
  });

  const unlockedIds = new Set(unlocked.map((u) => u.milestone_id));

  return {
    milestones,
    unlocked,
    unlockedIds,
    isLoading: loadingMilestones || loadingUnlocked,
    claim,
  };
};
