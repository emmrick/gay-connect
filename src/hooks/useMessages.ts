import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Message = Tables<'messages'>;

interface MessageWithProfile extends Message {
  senderUsername?: string;
  senderAvatar?: string | null;
  replyToMessage?: {
    id: string;
    content: string;
    senderUsername: string;
  } | null;
}

export const useMessages = (chatRoomId: string | null, searchQuery?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch messages
  const query = useQuery({
    queryKey: ['messages', chatRoomId],
    queryFn: async (): Promise<MessageWithProfile[]> => {
      if (!chatRoomId) return [];

      // First get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .eq('is_private', false)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      if (!messages) return [];

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      
      // Fetch profiles for all senders
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', senderIds);

      // Map profiles to messages
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Create message map for replies
      const messageMap = new Map(messages.map(m => [m.id, m]));
      
      return messages.map(msg => {
        const replyTo = msg.reply_to_id ? messageMap.get(msg.reply_to_id) : null;
        return {
          ...msg,
          senderUsername: profileMap.get(msg.sender_id)?.username || 'Anonyme',
          senderAvatar: profileMap.get(msg.sender_id)?.avatar_url,
          replyToMessage: replyTo ? {
            id: replyTo.id,
            content: replyTo.content || '',
            senderUsername: profileMap.get(replyTo.sender_id)?.username || 'Anonyme',
          } : null,
        };
      });
    },
    enabled: !!chatRoomId,
  });

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery || !query.data) return query.data || [];
    const lowerQuery = searchQuery.toLowerCase();
    return query.data.filter(msg => 
      msg.content?.toLowerCase().includes(lowerQuery) ||
      msg.senderUsername?.toLowerCase().includes(lowerQuery)
    );
  }, [query.data, searchQuery]);

  // Get search result indices
  const searchResults = useMemo(() => {
    if (!searchQuery || !query.data) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return query.data
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => 
        msg.content?.toLowerCase().includes(lowerQuery)
      )
      .map(({ msg }) => msg.id);
  }, [query.data, searchQuery]);

  // Real-time subscription
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`messages-${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', (payload.new as Message).sender_id)
            .maybeSingle();

          const newMessage: MessageWithProfile = {
            ...(payload.new as Message),
            senderUsername: profile?.username || 'Anonyme',
            senderAvatar: profile?.avatar_url,
          };

          queryClient.setQueryData<MessageWithProfile[]>(
            ['messages', chatRoomId],
            (old) => [...(old || []), newMessage]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, messageType, replyToId }: { content: string; messageType: 'text' | 'image' | 'video'; replyToId?: string }) => {
      if (!user || !chatRoomId) throw new Error('Not authenticated or no room');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content,
          message_type: messageType,
          is_private: false,
          reply_to_id: replyToId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  return {
    messages: query.data || [],
    filteredMessages,
    searchResults,
    isLoading: query.isLoading,
    error: query.error,
    sendMessage,
  };
};
