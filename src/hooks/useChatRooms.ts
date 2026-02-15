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

export const useChatRoom = (regionCodeOrId: string) => {
  return useQuery({
    queryKey: ['chat-room', regionCodeOrId],
    queryFn: async (): Promise<ChatRoom | null> => {
      // First try by region_code (for regional groups)
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('region_code', regionCodeOrId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;

      // Fallback: try by id (for custom groups)
      const { data: byId, error: idError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', regionCodeOrId)
        .maybeSingle();

      if (idError) throw idError;
      return byId;
    },
    enabled: !!regionCodeOrId,
  });
};
