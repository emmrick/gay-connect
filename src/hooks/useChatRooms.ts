import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type ChatRoom = Tables<'chat_rooms'>;

export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async (): Promise<ChatRoom[]> => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('region_code');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useChatRoom = (regionCode: string) => {
  return useQuery({
    queryKey: ['chat-room', regionCode],
    queryFn: async (): Promise<ChatRoom | null> => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('region_code', regionCode)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!regionCode,
  });
};
