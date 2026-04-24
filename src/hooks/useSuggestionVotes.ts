import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunitySuggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  examples: string | null;
  status: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: 'up' | 'down' | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
}

export const useCommunitySuggestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['community-suggestions', user?.id],
    queryFn: async (): Promise<CommunitySuggestion[]> => {
      // 1. Suggestions publiques
      const { data: suggestions, error } = await supabase
        .from('user_suggestions')
        .select('id, user_id, title, description, examples, status, created_at')
        .in('status', ['in_review', 'approved'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !suggestions) return [];
      if (suggestions.length === 0) return [];

      const ids = suggestions.map((s) => s.id);
      const authorIds = Array.from(new Set(suggestions.map((s) => s.user_id)));

      // 2. Tous les votes (groupés côté client)
      const { data: votes } = await supabase
        .from('suggestion_votes' as any)
        .select('suggestion_id, voter_user_id, vote_type')
        .in('suggestion_id', ids);

      // 3. Auteurs (username + avatar)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const voteMap = new Map<string, { up: number; down: number; mine: 'up' | 'down' | null }>();

      (votes as any[] ?? []).forEach((v) => {
        const cur = voteMap.get(v.suggestion_id) ?? { up: 0, down: 0, mine: null };
        if (v.vote_type === 'up') cur.up++;
        else if (v.vote_type === 'down') cur.down++;
        if (user?.id && v.voter_user_id === user.id) cur.mine = v.vote_type;
        voteMap.set(v.suggestion_id, cur);
      });

      return suggestions.map((s) => {
        const v = voteMap.get(s.id) ?? { up: 0, down: 0, mine: null };
        const author: any = profileMap.get(s.user_id);
        return {
          ...s,
          upvotes: v.up,
          downvotes: v.down,
          score: v.up - v.down,
          myVote: v.mine,
          authorUsername: author?.username ?? null,
          authorAvatarUrl: author?.avatar_url ?? null,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Realtime : toute nouvelle vote rafraîchit la liste
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('community-suggestion-votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'suggestion_votes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['community-suggestions', user.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

export const useCastSuggestionVote = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      voteType,
    }: {
      suggestionId: string;
      voteType: 'up' | 'down';
    }) => {
      const { data, error } = await supabase.rpc('cast_suggestion_vote' as any, {
        _suggestion_id: suggestionId,
        _vote_type: voteType,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; action?: string; cost?: number };
      if (!result?.success) {
        throw new Error(result?.error ?? 'VOTE_FAILED');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-suggestions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['credits', user?.id] });
    },
  });
};
