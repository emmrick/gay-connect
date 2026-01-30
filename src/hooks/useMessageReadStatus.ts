import { useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMessageReadStatus = (otherUserId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Mark messages from this conversation as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !otherUserId) return;

      // Use the database function to mark messages as read
      const { data, error } = await supabase.rpc('mark_messages_as_read', {
        _user_id: user.id,
        _sender_id: otherUserId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh read status
      queryClient.invalidateQueries({ queryKey: ['private-messages', user?.id, otherUserId] });
    },
  });

  // Subscribe to read status updates for sent messages
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`read-status-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          // Only handle if this message was read (read_at changed from null)
          if (payload.new && (payload.new as { read_at: string | null }).read_at !== null) {
            queryClient.invalidateQueries({ queryKey: ['private-messages', user.id, otherUserId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, queryClient]);

  // Call markAsRead when entering a conversation
  const markConversationAsRead = useCallback(() => {
    if (otherUserId) {
      markAsRead.mutate();
    }
  }, [otherUserId, markAsRead]);

  return {
    markConversationAsRead,
    isMarking: markAsRead.isPending,
  };
};

// Helper to determine message status
export const getMessageStatus = (
  message: { sender_id: string; read_at: string | null; created_at: string },
  currentUserId: string | undefined
): 'pending' | 'sent' | 'read' => {
  // Only show status for own messages
  if (message.sender_id !== currentUserId) {
    return 'sent';
  }

  // If message has read_at, it's been read
  if (message.read_at) {
    return 'read';
  }

  // Message has been sent but not read
  return 'sent';
};
