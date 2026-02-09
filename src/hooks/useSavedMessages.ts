import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserUsage } from './useUserUsage';
import { useCredits } from './useCredits';
import { useCreditDialog } from '@/contexts/CreditDialogContext';
import { toast } from 'sonner';

// Credit costs for saved messages
// First message is free, then progressive: 5, 10, 15, 20...
// Formula: currentCount * 5 (where currentCount is how many messages you already have)
export const SAVED_MESSAGE_COSTS = {
  update: 2.0,
};

/**
 * Calculate the cost to create the next saved message
 * 1st message = free (0 credits)
 * 2nd = 5, 3rd = 10, 4th = 15... 19th = 90
 * 20th = 100 (special case)
 * Formula: (n-1) * 5, except 20th = 100
 */
export const getCreateCost = (currentCount: number): number => {
  if (currentCount === 0) return 0;
  if (currentCount === 19) return 100; // 20th message special price
  return currentCount * 5;
};

interface SavedMessage {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useSavedMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    canAddSavedMessage, 
    incrementSavedMessages, 
    decrementSavedMessages,
    savedMessagesCount, 
    limits
  } = useUserUsage();
  const { totalCredits, hasEnoughCredits, deductCredits } = useCredits();
  const { showInsufficientCreditsDialog } = useCreditDialog();

  // Fetch saved messages from database
  const query = useQuery({
    queryKey: ['saved-messages', user?.id],
    queryFn: async (): Promise<SavedMessage[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const currentMessageCount = query.data?.length ?? 0;
  const nextCreateCost = getCreateCost(currentMessageCount);

  // Add new saved message
  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const cost = getCreateCost(currentMessageCount);

      // Check credit balance first (skip if free)
      if (cost > 0 && !hasEnoughCredits(cost)) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Check limit before adding
      if (!canAddSavedMessage()) {
        throw new Error('LIMIT_REACHED');
      }

      // Deduct credits (if not free)
      if (cost > 0) {
        await deductCredits.mutateAsync({
          amount: cost,
          transactionType: 'saved_message_create',
          description: `Création d'un message enregistré (${cost.toFixed(1)} crédits)`,
        });
      }

      const { data, error } = await supabase
        .from('saved_messages')
        .insert({
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Increment usage counter
      await incrementSavedMessages();

      return { data, cost };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['saved-messages', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-usage', user?.id] });
    },
    onError: (error: Error) => {
      if (error.message === 'INSUFFICIENT_CREDITS') {
        showInsufficientCreditsDialog(nextCreateCost, 'Créer un message enregistré');
      } else if (error.message === 'LIMIT_REACHED') {
        toast.error(
          `Limite atteinte ! Vous avez ${savedMessagesCount}/${limits.maxSavedMessages} message(s) enregistré(s).`
        );
      } else {
        console.error('Error adding saved message:', error);
        toast.error('Erreur lors de l\'enregistrement du message');
      }
    },
  });

  // Update saved message
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check credit balance first
      if (!hasEnoughCredits(SAVED_MESSAGE_COSTS.update)) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Deduct credits first
      await deductCredits.mutateAsync({
        amount: SAVED_MESSAGE_COSTS.update,
        transactionType: 'saved_message_update',
        description: 'Modification d\'un message enregistré',
      });

      const { data, error } = await supabase
        .from('saved_messages')
        .update({ content: content.trim() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-messages', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-usage', user?.id] });
    },
    onError: (error: Error) => {
      if (error.message === 'INSUFFICIENT_CREDITS') {
        showInsufficientCreditsDialog(SAVED_MESSAGE_COSTS.update, 'Modifier un message enregistré');
      } else {
        console.error('Error updating saved message:', error);
        toast.error('Erreur lors de la mise à jour du message');
      }
    },
  });

  // Delete saved message
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_messages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Decrement usage counter
      await decrementSavedMessages();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-messages', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-usage', user?.id] });
    },
    onError: (error) => {
      console.error('Error deleting saved message:', error);
      toast.error('Erreur lors de la suppression du message');
    },
  });

  const addMessage = (content: string) => {
    if (!content.trim()) return;
    return addMutation.mutateAsync(content);
  };

  const deleteMessage = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const updateMessage = (id: string, content: string) => {
    if (!content.trim()) return;
    return updateMutation.mutateAsync({ id, content });
  };

  return {
    savedMessages: query.data || [],
    isLoading: query.isLoading,
    addMessage,
    deleteMessage,
    updateMessage,
    canAddMore: canAddSavedMessage(),
    remainingSlots: Math.max(0, limits.maxSavedMessages - savedMessagesCount),
    canAffordCreate: nextCreateCost === 0 || hasEnoughCredits(nextCreateCost),
    canAffordUpdate: hasEnoughCredits(SAVED_MESSAGE_COSTS.update),
    totalCredits,
    nextCreateCost,
  };
};
