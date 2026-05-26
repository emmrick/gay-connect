import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlanNowAutoReplies {
  user_id: string;
  looking_for: string | null;
  available_now: string | null;
  photo_exchange: string | null;
  enabled: boolean;
}

const DEFAULTS: Omit<PlanNowAutoReplies, 'user_id'> = {
  looking_for: '',
  available_now: '',
  photo_exchange: '',
  enabled: true,
};

export const usePlanNowAutoReplies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['plan-now-auto-replies', user?.id],
    queryFn: async (): Promise<PlanNowAutoReplies | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('plan_now_auto_replies' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as PlanNowAutoReplies | null;
    },
    enabled: !!user?.id,
  });

  const upsert = useMutation({
    mutationFn: async (patch: Partial<Omit<PlanNowAutoReplies, 'user_id'>>) => {
      if (!user?.id) throw new Error('Non authentifié');
      const current = query.data ?? { ...DEFAULTS, user_id: user.id };
      const row = { ...current, ...patch, user_id: user.id };
      const { error } = await supabase
        .from('plan_now_auto_replies' as any)
        .upsert(row as any, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-now-auto-replies', user?.id] });
    },
    onError: (err: Error) => toast.error('Erreur', { description: err.message }),
  });

  return {
    data: query.data ?? { ...DEFAULTS, user_id: user?.id ?? '' },
    isLoading: query.isLoading,
    save: upsert.mutateAsync,
    isSaving: upsert.isPending,
  };
};
