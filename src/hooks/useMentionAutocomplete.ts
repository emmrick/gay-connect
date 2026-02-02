import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MentionUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export const useMentionAutocomplete = (chatRoomId?: string) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);

  // Search for users matching the query
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `${query}%`)
        .neq('user_id', user?.id || '')
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Debounced search
  useEffect(() => {
    if (!mentionQuery) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(mentionQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [mentionQuery, searchUsers]);

  // Handle text change to detect @ mentions
  const handleTextChange = useCallback((text: string, cursorPosition: number) => {
    // Find the @ symbol before cursor
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setIsActive(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
      return;
    }

    // Check if @ is at start or after a space
    const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && lastAtIndex !== 0) {
      setIsActive(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
      return;
    }

    // Get the query after @
    const query = textBeforeCursor.slice(lastAtIndex + 1);
    
    // Check if there's a space in the query (mention ended)
    if (query.includes(' ') || query.includes('\n')) {
      setIsActive(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
      return;
    }

    setIsActive(true);
    setMentionQuery(query);
    setMentionStartIndex(lastAtIndex);
  }, []);

  // Insert the selected mention into text
  const insertMention = useCallback((text: string, selectedUser: MentionUser): string => {
    if (mentionStartIndex === -1) return text;

    const beforeMention = text.slice(0, mentionStartIndex);
    const afterMention = text.slice(mentionStartIndex + mentionQuery.length + 1);
    
    return `${beforeMention}@${selectedUser.username} ${afterMention}`;
  }, [mentionStartIndex, mentionQuery]);

  // Close autocomplete
  const closeMention = useCallback(() => {
    setIsActive(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    isActive,
    mentionQuery,
    handleTextChange,
    insertMention,
    closeMention,
  };
};
