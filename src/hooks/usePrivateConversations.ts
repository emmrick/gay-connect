import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUserUsage } from './useUserUsage';
import { toast } from 'sonner';
import { supabaseQueryWithTimeout } from '@/lib/supabaseWithAbort';

type PrivateConversation = Tables<'private_conversations'>;

interface ConversationWithProfile extends PrivateConversation {
  otherUser: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string | null;
  };
  lastMessage?: {
    content: string | null;
    created_at: string;
    message_type: string;
  };
}

export const usePrivateConversations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { 
    canStartConversation, 
    incrementConversations, 
    conversationsCount, 
    limits,
    isPremium 
  } = useUserUsage();

  // Fetch conversation statuses - with robust error handling
  const statusQuery = useQuery({
    queryKey: ['private-conversation-status', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const result = await supabaseQueryWithTimeout(
        supabase
          .from('private_conversation_status')
          .select('*')
          .eq('user_id', user.id),
        8000
      );
      
      // Return empty array on error instead of throwing - statuses are optional
      if (result.error) {
        console.warn('Failed to fetch conversation status:', result.error);
        return [];
      }
      return result.data || [];
    },
    enabled: !!user,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  });

  const query = useQuery({
    queryKey: ['private-conversations', user?.id],
    queryFn: async (): Promise<ConversationWithProfile[]> => {
      if (!user) return [];

      // Get all conversations for the current user with timeout
      const convResult = await supabaseQueryWithTimeout(
        supabase
          .from('private_conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        10000
      );

      if (convResult.error) throw new Error(convResult.error.message);
      
      const conversations = convResult.data || [];
      if (conversations.length === 0) return [];

      // Get other user IDs
      const otherUserIds = conversations.map(conv => 
        conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      );

      // De-duplicate to keep query strings small and avoid redundant work
      const uniqueOtherUserIds = Array.from(new Set(otherUserIds));

      // Fetch profiles and messages in parallel
      const [profilesResult, messagesResult] = await Promise.all([
        supabaseQueryWithTimeout(
          supabase
            .from('profiles')
            .select('user_id, username, avatar_url, is_online, last_seen')
            .in('user_id', uniqueOtherUserIds),
          8000
        ),
        supabaseQueryWithTimeout(
          supabase
            .from('messages')
            .select('sender_id, recipient_id, content, created_at, message_type')
            .eq('is_private', true)
            .is('deleted_at', null)
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(200),
          8000
        ),
      ]);

      const profileMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

      // Build last message map
      const lastMessageMap = new Map<string, { content: string | null; created_at: string; message_type: string }>();
      
      if (!messagesResult.error && messagesResult.data) {
        for (const msg of messagesResult.data) {
          const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          if (!otherId) continue;
          if (!uniqueOtherUserIds.includes(otherId)) continue;
          if (!lastMessageMap.has(otherId)) {
            lastMessageMap.set(otherId, {
              content: msg.content,
              created_at: msg.created_at,
              message_type: msg.message_type,
            });
          }
          if (lastMessageMap.size >= uniqueOtherUserIds.length) break;
        }
      }

      const conversationsWithData: ConversationWithProfile[] = conversations.map((conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

        return {
          ...conv,
          otherUser: profileMap.get(otherUserId) || {
            user_id: otherUserId,
            username: 'Utilisateur',
            avatar_url: null,
            is_online: false,
            last_seen: null,
          },
          lastMessage: lastMessageMap.get(otherUserId) || undefined,
        };
      });

      // Sort by last message date (most recent first)
      return conversationsWithData.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    },
    enabled: !!user,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000,
    retry: 0,
  });

  // Filter conversations based on status
  const allConversations = query.data || [];
  const statuses = statusQuery.data || [];
  
  const statusMap = new Map(statuses.map(s => [s.conversation_id, s]));
  
  // Active conversations: not archived and not deleted
  const activeConversations = allConversations.filter(conv => {
    const status = statusMap.get(conv.id);
    if (!status) return true;
    return !status.is_archived && !status.is_deleted;
  });
  
  // Archived conversations: archived but not deleted
  const archivedConversations = allConversations.filter(conv => {
    const status = statusMap.get(conv.id);
    if (!status) return false;
    return status.is_archived && !status.is_deleted;
  });

  // Deleted conversations: marked as deleted but NOT permanently deleted
  const deletedConversations = allConversations.filter(conv => {
    const status = statusMap.get(conv.id);
    if (!status) return false;
    return status.is_deleted && !status.is_archived;
  });

  // Real-time subscription for new conversations AND new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`private-conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['private-conversations', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `is_private=eq.true`,
        },
        (payload) => {
          const msg = payload.new as { sender_id: string; recipient_id: string };
          if (msg.sender_id === user.id || msg.recipient_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['private-conversations', user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Create or get existing conversation
  const getOrCreateConversation = useMutation({
    mutationFn: async (otherUserId: string): Promise<PrivateConversation> => {
      if (!user) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('private_conversations')
        .select('*')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) return existing;

      // Check limit before creating new conversation
      if (!canStartConversation()) {
        throw new Error('LIMIT_REACHED');
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('private_conversations')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment usage counter for new conversation
      await incrementConversations();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-conversations', user?.id] });
    },
    onError: (error: Error) => {
      if (error.message === 'LIMIT_REACHED') {
        toast.error(
          `Limite atteinte ! Vous avez démarré ${conversationsCount}/${limits.conversationsPerWeek} conversations cette semaine.`,
          {
            action: isPremium ? undefined : {
              label: 'Passer Premium',
              onClick: () => window.location.href = '/?tab=premium',
            },
          }
        );
      }
    },
  });

  return {
    conversations: activeConversations,
    archivedConversations,
    deletedConversations,
    isLoading: query.isLoading,
    error: query.error,
    getOrCreateConversation,
    canStartNewConversation: canStartConversation(),
    remainingConversations: Math.max(0, limits.conversationsPerWeek - conversationsCount),
  };
};
