import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePrivateTypingIndicator = (otherUserId: string | null) => {
  const { user, profile } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const otherTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a consistent conversation key
  const conversationKey = useCallback(() => {
    if (!user?.id || !otherUserId) return null;
    // Sort IDs to ensure same key regardless of who's sender/receiver
    const ids = [user.id, otherUserId].sort();
    return `private-${ids[0]}-${ids[1]}`;
  }, [user?.id, otherUserId])();

  // Subscribe to typing indicators for this private conversation using Broadcast (more reliable)
  useEffect(() => {
    if (!conversationKey || !otherUserId || !user?.id) return;

    console.log('[Typing] Subscribing to broadcast channel:', conversationKey);

    // Use Supabase Broadcast for typing - more reliable than postgres_changes
    const channel = supabase
      .channel(`typing-broadcast-${conversationKey}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('[Typing] Received broadcast:', payload);
        
        if (payload.payload?.user_id === otherUserId) {
          console.log('[Typing] Other user is typing');
          setIsOtherTyping(true);
          
          // Clear existing timeout
          if (otherTypingTimeoutRef.current) {
            clearTimeout(otherTypingTimeoutRef.current);
          }
          
          // Auto-hide after 3 seconds if no update
          otherTypingTimeoutRef.current = setTimeout(() => {
            console.log('[Typing] Timeout - hiding indicator');
            setIsOtherTyping(false);
          }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        console.log('[Typing] Received stop broadcast:', payload);
        
        if (payload.payload?.user_id === otherUserId) {
          console.log('[Typing] Other user stopped typing');
          setIsOtherTyping(false);
          if (otherTypingTimeoutRef.current) {
            clearTimeout(otherTypingTimeoutRef.current);
          }
        }
      })
      .subscribe((status) => {
        console.log('[Typing] Broadcast subscription status:', status);
      });

    return () => {
      console.log('[Typing] Unsubscribing from broadcast channel');
      supabase.removeChannel(channel);
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
      }
    };
  }, [conversationKey, otherUserId, user?.id]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (conversationKey && user?.id && isTypingRef.current) {
        const channel = supabase.channel(`typing-broadcast-${conversationKey}`);
        channel.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: { user_id: user.id },
        });
      }
    };
  }, [conversationKey, user?.id]);

  const startTyping = useCallback(async () => {
    if (!conversationKey || !user?.id || !profile?.username) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only broadcast if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      console.log('[Typing] Starting to type, broadcasting');
      
      // Use Broadcast instead of database for instant delivery
      const channel = supabase.channel(`typing-broadcast-${conversationKey}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, username: profile.username },
      });
    }

    // Set timeout to stop typing after 3 seconds of no activity
    typingTimeoutRef.current = setTimeout(async () => {
      console.log('[Typing] Timeout - stopping typing');
      isTypingRef.current = false;
      
      const channel = supabase.channel(`typing-broadcast-${conversationKey}`);
      await channel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: user.id },
      });
    }, 3000);
  }, [conversationKey, user?.id, profile?.username]);

  const stopTyping = useCallback(async () => {
    if (!conversationKey || !user?.id) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      console.log('[Typing] Manually stopping typing');
      
      const channel = supabase.channel(`typing-broadcast-${conversationKey}`);
      await channel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: user.id },
      });
    }
  }, [conversationKey, user?.id]);

  return {
    isOtherTyping,
    startTyping,
    stopTyping,
  };
};
