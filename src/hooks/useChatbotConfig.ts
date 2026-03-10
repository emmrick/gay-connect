import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatbotConfig {
  id: string;
  user_id: string;
  is_active: boolean;
  greeting_message: string;
  chatbot_info: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatbotNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  label: string;
  response_text: string | null;
  display_order: number;
  is_root: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Config (is_active, greeting) ───
export const useChatbotConfig = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['chatbot-config', targetUserId],
    queryFn: async (): Promise<ChatbotConfig | null> => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from('user_chatbot_config' as any)
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (error) return null;
      return data as any;
    },
    enabled: !!targetUserId,
  });
};

export const useUpdateChatbotConfig = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      is_active?: boolean;
      greeting_message?: string;
      chatbot_info?: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('user_chatbot_config' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_chatbot_config' as any)
          .update(config as any)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_chatbot_config' as any)
          .insert({ user_id: user.id, ...config } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', user?.id] });
      toast.success('ChatBot mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

// ─── Flow nodes ───
export const useChatbotNodes = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['chatbot-nodes', targetUserId],
    queryFn: async (): Promise<ChatbotNode[]> => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('user_chatbot_nodes' as any)
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) return [];
      return (data || []) as any[];
    },
    enabled: !!targetUserId,
  });
};

export const useAddChatbotNode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (node: {
      parent_id?: string | null;
      label: string;
      response_text?: string | null;
      is_root?: boolean;
      display_order?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_chatbot_nodes' as any)
        .insert({
          user_id: user.id,
          parent_id: node.parent_id || null,
          label: node.label,
          response_text: node.response_text || null,
          is_root: node.is_root || false,
          display_order: node.display_order || 0,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-nodes', user?.id] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });
};

export const useUpdateChatbotNode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; label?: string; response_text?: string | null }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_chatbot_nodes' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-nodes', user?.id] });
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useDeleteChatbotNode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_chatbot_nodes' as any)
        .delete()
        .eq('id', nodeId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-nodes', user?.id] });
      toast.success('Option supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
};

// ─── Conversation history (kept for logging) ───
export const useChatbotConversation = (profileUserId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['chatbot-conversation', user?.id, profileUserId],
    queryFn: async () => {
      if (!user?.id || !profileUserId) return [];
      const { data, error } = await supabase
        .from('chatbot_conversations' as any)
        .select('*')
        .eq('visitor_user_id', user.id)
        .eq('profile_user_id', profileUserId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) return [];
      return (data || []) as any[];
    },
    enabled: !!user?.id && !!profileUserId,
  });
};
