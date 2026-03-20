import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PollOption {
  id: string;
  option_text: string;
  display_order: number;
  vote_count: number;
  voters: string[];
  hasVoted: boolean;
}

export interface Poll {
  id: string;
  message_id: string;
  chat_room_id: string;
  question: string;
  is_multiple_choice: boolean;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  options: PollOption[];
  total_votes: number;
}

export const usePolls = (chatRoomId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['polls', chatRoomId],
    queryFn: async (): Promise<Poll[]> => {
      if (!chatRoomId || !user) return [];

      const { data: polls, error } = await supabase
        .from('poll_messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!polls || polls.length === 0) return [];

      const pollIds = polls.map(p => p.id);

      const [optionsResult, votesResult] = await Promise.all([
        supabase.from('poll_options').select('*').in('poll_id', pollIds).order('display_order'),
        supabase.from('poll_votes').select('*').in('poll_id', pollIds),
      ]);

      const options = optionsResult.data || [];
      const votes = votesResult.data || [];

      return polls.map(poll => {
        const pollOptions = options.filter(o => o.poll_id === poll.id);
        const pollVotes = votes.filter(v => v.poll_id === poll.id);

        return {
          ...poll,
          options: pollOptions.map(opt => {
            const optVotes = pollVotes.filter(v => v.option_id === opt.id);
            return {
              id: opt.id,
              option_text: opt.option_text,
              display_order: opt.display_order,
              vote_count: optVotes.length,
              voters: optVotes.map(v => v.user_id),
              hasVoted: optVotes.some(v => v.user_id === user.id),
            };
          }),
          total_votes: new Set(pollVotes.map(v => v.user_id)).size,
        };
      });
    },
    enabled: !!chatRoomId && !!user,
  });

  // Realtime for votes
  const pollIds = query.data?.map(p => p.id) || [];
  
  // Subscribe to vote changes
  useQuery({
    queryKey: ['poll-votes-subscription', chatRoomId, pollIds.join(',')],
    queryFn: () => null,
    enabled: false,
  });

  const createPoll = useMutation({
    mutationFn: async ({ question, options, isMultipleChoice, messageId }: {
      question: string;
      options: string[];
      isMultipleChoice: boolean;
      messageId: string;
    }) => {
      if (!user || !chatRoomId) throw new Error('Not authenticated');

      const { data: poll, error: pollError } = await supabase
        .from('poll_messages')
        .insert({
          message_id: messageId,
          chat_room_id: chatRoomId,
          question,
          is_multiple_choice: isMultipleChoice,
          created_by: user.id,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionInserts = options.map((text, i) => ({
        poll_id: poll.id,
        option_text: text,
        display_order: i,
      }));

      const { error: optError } = await supabase
        .from('poll_options')
        .insert(optionInserts);

      if (optError) throw optError;
      return poll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', chatRoomId] });
    },
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if poll is locked
      const poll = query.data?.find(p => p.id === pollId);
      if (poll?.is_locked) {
        throw new Error('Ce sondage est verrouillé');
      }

      // For single-choice: remove existing votes first
      if (poll && !poll.is_multiple_choice) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('poll_votes')
        .insert({ poll_id: pollId, option_id: optionId, user_id: user.id });

      if (error) {
        if (error.code === '23505') {
          // Already voted, remove vote (toggle)
          await supabase
            .from('poll_votes')
            .delete()
            .eq('poll_id', pollId)
            .eq('option_id', optionId)
            .eq('user_id', user.id);
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', chatRoomId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const lockPoll = useMutation({
    mutationFn: async (pollId: string) => {
      const { error } = await supabase
        .from('poll_messages')
        .update({ is_locked: true })
        .eq('id', pollId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', chatRoomId] });
      toast.success('Sondage verrouillé');
    },
  });

  const getPollForMessage = (messageId: string): Poll | undefined => {
    return query.data?.find(p => p.message_id === messageId);
  };

  return {
    polls: query.data || [],
    isLoading: query.isLoading,
    createPoll,
    vote,
    lockPoll,
    getPollForMessage,
  };
};
