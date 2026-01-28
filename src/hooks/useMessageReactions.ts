import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactions {
  [messageId: string]: Reaction[];
}

export const useMessageReactions = (chatRoomId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch reactions for all messages in the room
  const query = useQuery({
    queryKey: ['message-reactions', chatRoomId],
    queryFn: async (): Promise<MessageReactions> => {
      if (!chatRoomId) return {};

      // Get all message IDs for this room first
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_room_id', chatRoomId);

      if (!messages || messages.length === 0) return {};

      const messageIds = messages.map(m => m.id);

      // Get reactions for these messages
      const { data: reactions, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;
      if (!reactions) return {};

      // Group reactions by message_id and emoji
      const groupedReactions: MessageReactions = {};

      reactions.forEach(reaction => {
        if (!groupedReactions[reaction.message_id]) {
          groupedReactions[reaction.message_id] = [];
        }

        const existingReaction = groupedReactions[reaction.message_id].find(
          r => r.emoji === reaction.emoji
        );

        if (existingReaction) {
          existingReaction.count++;
          existingReaction.users.push(reaction.user_id);
          if (reaction.user_id === user?.id) {
            existingReaction.hasReacted = true;
          }
        } else {
          groupedReactions[reaction.message_id].push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user_id],
            hasReacted: reaction.user_id === user?.id,
          });
        }
      });

      return groupedReactions;
    },
    enabled: !!chatRoomId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`reactions-${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          // Refetch reactions on any change
          queryClient.invalidateQueries({ queryKey: ['message-reactions', chatRoomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, queryClient]);

  // Toggle reaction mutation
  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', chatRoomId] });
    },
  });

  const getReactionsForMessage = useCallback((messageId: string): Reaction[] => {
    return query.data?.[messageId] || [];
  }, [query.data]);

  return {
    reactions: query.data || {},
    getReactionsForMessage,
    toggleReaction,
    isLoading: query.isLoading,
  };
};
