import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactions {
  [messageId: string]: Reaction[];
}

export const usePrivateMessageReactions = (otherUserId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = ['private-message-reactions', user?.id, otherUserId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MessageReactions> => {
      if (!user || !otherUserId) return {};

      // Get private message IDs for this conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('is_private', true)
        .is('deleted_at', null)
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (!messages || messages.length === 0) return {};

      const messageIds = messages.map(m => m.id);

      const { data: reactions, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;
      if (!reactions) return {};

      const grouped: MessageReactions = {};

      reactions.forEach(reaction => {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = [];
        }

        const existing = grouped[reaction.message_id].find(r => r.emoji === reaction.emoji);

        if (existing) {
          existing.count++;
          if (reaction.user_id === user.id) existing.hasReacted = true;
        } else {
          grouped[reaction.message_id].push({
            emoji: reaction.emoji,
            count: 1,
            hasReacted: reaction.user_id === user.id,
          });
        }
      });

      return grouped;
    },
    enabled: !!user && !!otherUserId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`pm-reactions-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, queryClient]);

  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const getReactionsForMessage = useCallback((messageId: string): Reaction[] => {
    return query.data?.[messageId] || [];
  }, [query.data]);

  return { getReactionsForMessage, toggleReaction };
};
