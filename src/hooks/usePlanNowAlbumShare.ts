/**
 * usePlanNowAlbumShare — partage rapide d'album entre 2 utilisateurs en Plan Now mutuel.
 * Réutilise la table `album_shares` avec une expiration courte (30 min).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsPlanNowActive } from './usePlanNowSession';
import { useCreateNotification } from './useNotifications';
import { toast } from 'sonner';

const SHARE_DURATION_MINUTES = 30;

export const usePlanNowMutualActive = (otherUserId?: string | null) => {
  const { user } = useAuth();
  const meActive = useIsPlanNowActive(user?.id);
  const otherActive = useIsPlanNowActive(otherUserId);
  return meActive && otherActive;
};

export const usePlanNowAlbumShare = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();

  const shareAlbum = useMutation({
    mutationFn: async ({
      albumId,
      albumName,
      toUserId,
    }: {
      albumId: string;
      albumName: string;
      toUserId: string;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const expiresAt = new Date(Date.now() + SHARE_DURATION_MINUTES * 60_000).toISOString();

      // Crée le partage avec expiration 30 min (gratuit pour Plan Now mutuel)
      const { data: shareData, error: shareError } = await supabase
        .from('album_shares')
        .insert({
          album_id: albumId,
          shared_with_user_id: toUserId,
          shared_by_user_id: user.id,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Insère un message spécial dans le DM
      const messageContent = JSON.stringify({
        shareId: shareData.id,
        albumId,
        albumName,
        expiresAt,
        planNow: true,
      });

      const { error: msgError } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: toUserId,
        content: messageContent,
        message_type: 'album_share',
        is_private: true,
        chat_room_id: null,
      });

      if (msgError) throw msgError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      return { shareData, albumName, senderUsername: profile?.username };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['album-shares'] });
      queryClient.invalidateQueries({ queryKey: ['private-messages', user?.id, variables.toUserId] });
      queryClient.invalidateQueries({ queryKey: ['private-conversations', user?.id] });

      createNotification.mutate({
        userId: variables.toUserId,
        type: 'album_share',
        title: '⚡ Album Plan Now partagé',
        message: `${result.senderUsername || 'Quelqu\'un'} t'a envoyé "${result.albumName}" pour 30 min`,
        actionUrl: '/messages',
      });

      toast.success('Album partagé !', {
        description: 'Visible pendant 30 minutes.',
      });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors du partage', { description: err.message });
    },
  });

  return {
    shareAlbum: shareAlbum.mutate,
    isSharing: shareAlbum.isPending,
    durationMinutes: SHARE_DURATION_MINUTES,
  };
};
