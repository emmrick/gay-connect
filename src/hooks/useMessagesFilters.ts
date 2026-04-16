/**
 * Centralizes the active sub-tab + transient UI state for the Messages page.
 * Kept tiny on purpose — heavy filtering already lives inside PrivateChatList.
 */
import { useState, useCallback } from 'react';

export type MessagesTab = 'conversations' | 'groups' | 'archived';

export const useMessagesFilters = (initial: MessagesTab = 'conversations') => {
  const [tab, setTab] = useState<MessagesTab>(initial);

  const setTabSafe = useCallback((value: string) => {
    if (value === 'conversations' || value === 'groups' || value === 'archived') {
      setTab(value);
    }
  }, []);

  return { tab, setTab, setTabSafe };
};
