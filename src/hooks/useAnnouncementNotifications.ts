import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncementChannel } from './useAnnouncementChannel';
import { playAnnouncementSoundStandalone } from './useNotificationSound';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';

/**
 * Global hook that listens for new announcement channel messages
 * and notifies all authenticated users with a chime sound.
 */
export const useAnnouncementNotifications = () => {
  const { user } = useAuth();
  const { data: announcementChannel } = useAnnouncementChannel();

  useEffect(() => {
    if (!user?.id || !announcementChannel?.id) return;

    const channel = supabase
      .channel('announcement-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${announcementChannel.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Don't notify for own messages
          if (newMsg.sender_id === user.id) return;

          // Play announcement chime
          playAnnouncementSoundStandalone();

          // Show toast notification
          toast('📢 Nouvelle annonce', {
            description: (newMsg.content || '').slice(0, 100),
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, announcementChannel?.id]);
};
