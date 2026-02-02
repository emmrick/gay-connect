import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationSoundStandalone } from '@/hooks/useNotificationSound';
import { notifyNewGroupMessage } from '@/services/pushNotificationService';

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
        .is('deleted_at', null) // Exclude soft-deleted messages
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
          const newMsg = payload.new as Message;
          
          // Check if message already exists to prevent duplicates
          const existingMessages = queryClient.getQueryData<MessageWithProfile[]>(['messages', chatRoomId]);
          if (existingMessages?.some(m => m.id === newMsg.id)) {
            return;
          }

          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();

          const newMessage: MessageWithProfile = {
            ...newMsg,
            senderUsername: profile?.username || 'Anonyme',
            senderAvatar: profile?.avatar_url,
          };

          queryClient.setQueryData<MessageWithProfile[]>(
            ['messages', chatRoomId],
            (old) => {
              // Double-check for duplicates before adding
              if (old?.some(m => m.id === newMessage.id)) return old;
              return [...(old || []), newMessage];
            }
          );

          // Play notification sound for incoming messages (not our own)
          if (newMsg.sender_id !== user?.id) {
            playNotificationSoundStandalone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, queryClient]);

  // Ref to prevent double submissions
  const sendingRef = useRef(false);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, messageType, replyToId }: { content: string; messageType: 'text' | 'image' | 'video'; replyToId?: string }) => {
      if (!user || !chatRoomId) throw new Error('Not authenticated or no room');
      
      // Prevent double submission
      if (sendingRef.current) {
        throw new Error('Message already being sent');
      }
      sendingRef.current = true;

      try {
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

        // Detect mentions in the message and send push notifications
        if (content && messageType === 'text') {
          const mentionRegex = /@(\w+)/g;
          const mentions = content.match(mentionRegex);
          
          if (mentions && mentions.length > 0) {
            const usernames = mentions.map(m => m.substring(1).toLowerCase());
            
            // Get chat room name
            const { data: roomData } = await supabase
              .from('chat_rooms')
              .select('region_name')
              .eq('id', chatRoomId)
              .single();

            // Get sender username
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', user.id)
              .single();

            // Find users with matching usernames
            const { data: mentionedProfiles } = await supabase
              .from('profiles')
              .select('user_id, username')
              .in('username', usernames.map(u => u.toLowerCase()));

            if (mentionedProfiles && mentionedProfiles.length > 0) {
              for (const mentionedUser of mentionedProfiles) {
                // Don't notify yourself
                if (mentionedUser.user_id === user.id) continue;

                // Send push notification
                notifyNewGroupMessage(
                  mentionedUser.user_id,
                  roomData?.region_name || 'Groupe',
                  senderProfile?.username || 'Quelqu\'un',
                  `@${mentionedUser.username} ${content.substring(0, 30)}...`
                );

                // Create in-app notification
                await supabase.from('notifications').insert({
                  user_id: mentionedUser.user_id,
                  type: 'group_mention',
                  title: `💬 Mention dans ${roomData?.region_name || 'un groupe'}`,
                  message: `${senderProfile?.username || 'Quelqu\'un'} t'a mentionné: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                  action_url: '/',
                });
              }
            }
          }
        }

        return data;
      } finally {
        sendingRef.current = false;
      }
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
