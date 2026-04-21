/**
 * Hooks de gestion du barème ChatBot Personnel.
 * - Lecture publique (utilisée par tous les utilisateurs pour afficher leur coût)
 * - Mutations admin pour éditer un palier ou le surcoût "+N par bloc supplémentaire"
 *
 * Le barème est stocké dans `personal_chatbot_pricing` :
 *   - une ligne par palier (node_count, total_cost)
 *   - extra_cost_per_node : surcoût appliqué AU-DELÀ du dernier palier
 *     (configurable, généralement 30 sur la dernière ligne)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatbotPricingTier {
  id: string;
  node_count: number;
  total_cost: number;
  extra_cost_per_node: number;
  created_at: string;
  updated_at: string;
}

export const useChatbotPricing = () => {
  return useQuery({
    queryKey: ['chatbot-pricing'],
    queryFn: async (): Promise<ChatbotPricingTier[]> => {
      const { data, error } = await supabase
        .from('personal_chatbot_pricing' as any)
        .select('*')
        .order('node_count', { ascending: true });
      if (error) {
        console.error('chatbot-pricing:', error);
        return [];
      }
      return (data || []) as any[];
    },
  });
};

export const useUpdateChatbotPricingTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; total_cost?: number; extra_cost_per_node?: number }) => {
      const update: Record<string, number> = {};
      if (params.total_cost !== undefined) update.total_cost = Math.max(0, Math.round(params.total_cost));
      if (params.extra_cost_per_node !== undefined) update.extra_cost_per_node = Math.max(0, Math.round(params.extra_cost_per_node));
      const { error } = await supabase
        .from('personal_chatbot_pricing' as any)
        .update(update as any)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-node-cost'] });
      toast.success('Barème mis à jour');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });
};

export const useAddChatbotPricingTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { node_count: number; total_cost: number }) => {
      const { error } = await supabase
        .from('personal_chatbot_pricing' as any)
        .insert({
          node_count: Math.max(1, Math.round(params.node_count)),
          total_cost: Math.max(0, Math.round(params.total_cost)),
          extra_cost_per_node: 0,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-node-cost'] });
      toast.success('Palier ajouté');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });
};

export const useDeleteChatbotPricingTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_chatbot_pricing' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-node-cost'] });
      toast.success('Palier supprimé');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });
};
