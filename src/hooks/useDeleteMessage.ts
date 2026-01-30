import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useDeleteMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Soft delete - mark as deleted but keep for moderation
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Only allow deleting own messages

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all message queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['private-messages'] });
      queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
      toast.success('Message supprimé');
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast.error('Impossible de supprimer le message');
    },
  });

  return {
    deleteMessage: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
};

