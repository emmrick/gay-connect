import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileStats {
  messagesCount: number;
  conversationsCount: number;
  reactionsCount: number;
}

export const useProfileStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async (): Promise<ProfileStats> => {
      if (!user) {
        return { messagesCount: 0, conversationsCount: 0, reactionsCount: 0 };
      }

      // Fetch message count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id);

      // Fetch conversations count
      const { count: conversationsCount } = await supabase
        .from('private_conversations')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      // Fetch reactions count
      const { count: reactionsCount } = await supabase
        .from('message_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        messagesCount: messagesCount || 0,
        conversationsCount: conversationsCount || 0,
        reactionsCount: reactionsCount || 0,
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
};
