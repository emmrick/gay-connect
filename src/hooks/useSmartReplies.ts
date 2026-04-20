import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SmartRepliesArgs {
  messages: any[];
  otherUserId: string;
  enabled?: boolean;
}

/**
 * Génère 3 chips de réponses rapides via Lovable AI dès qu'un nouveau message
 * de l'autre personne arrive. Désactivé tant que l'utilisateur tape.
 */
export const useSmartReplies = ({ messages, otherUserId, enabled = true }: SmartRepliesArgs) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedForMessageId, setDismissedForMessageId] = useState<string | null>(null);
  const lastFetchedMessageIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled || !user || messages.length === 0) {
      setSuggestions([]);
      return;
    }

    // Find last text message from the other person
    let lastFromOther: any = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender_id === user.id) {
        // own message after other → no suggestion needed
        setSuggestions([]);
        return;
      }
      const isText = !m.message_type || m.message_type === 'text';
      if (isText && m.content?.trim()) {
        lastFromOther = m;
        break;
      }
    }
    if (!lastFromOther) {
      setSuggestions([]);
      return;
    }

    // Already fetched for this message? skip.
    if (lastFetchedMessageIdRef.current === lastFromOther.id) return;
    if (dismissedForMessageId === lastFromOther.id) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    lastFetchedMessageIdRef.current = lastFromOther.id;
    setIsLoading(true);

    // Build short context (last 6 text messages)
    const ctx = messages
      .filter((m: any) => (!m.message_type || m.message_type === 'text') && m.content?.trim())
      .slice(-6)
      .map((m: any) => ({
        role: m.sender_id === user.id ? 'user' : 'assistant',
        content: String(m.content).slice(0, 400),
      }));

    supabase.functions
      .invoke('suggest-replies', { body: { messages: ctx } })
      .then(({ data, error }) => {
        if (error) {
          setSuggestions([]);
          return;
        }
        const arr = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(arr);
      })
      .catch(() => setSuggestions([]))
      .finally(() => {
        setIsLoading(false);
        inFlightRef.current = false;
      });
  }, [messages, user, enabled, otherUserId, dismissedForMessageId]);

  const dismiss = () => {
    if (lastFetchedMessageIdRef.current) {
      setDismissedForMessageId(lastFetchedMessageIdRef.current);
    }
    setSuggestions([]);
  };

  return { suggestions, isLoading, dismiss };
};
