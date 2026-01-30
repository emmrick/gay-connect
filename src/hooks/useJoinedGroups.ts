import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MAX_GROUPS = 3;
const STORAGE_KEY = 'joined_groups';

interface JoinedGroup {
  regionCode: string;
  regionName: string;
  joinedAt: string;
}

// Helper to safely access localStorage
const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('Failed to save to localStorage');
  }
};

export const useJoinedGroups = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage when user becomes available
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (user?.id) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      const stored = safeGetStorage(storageKey);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setJoinedGroups(parsed);
          }
        } catch {
          console.warn('Failed to parse joined groups from storage');
          setJoinedGroups([]);
        }
      } else {
        setJoinedGroups([]);
      }
    } else {
      // No user, clear groups
      setJoinedGroups([]);
    }
    
    setIsInitialized(true);
  }, [user?.id, authLoading]);

  // Save to localStorage when groups change (only after initialization)
  const saveGroups = useCallback((groups: JoinedGroup[]) => {
    if (user?.id) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      safeSetStorage(storageKey, JSON.stringify(groups));
      setJoinedGroups(groups);
    }
  }, [user?.id]);

  const joinGroup = useCallback((regionCode: string, regionName: string): boolean => {
    if (!user?.id) return false;
    
    // Check current state directly to avoid stale closure
    const currentGroups = joinedGroups;
    
    if (currentGroups.length >= MAX_GROUPS) {
      return false;
    }

    if (currentGroups.some(g => g.regionCode === regionCode)) {
      return true; // Already joined
    }

    const newGroup: JoinedGroup = {
      regionCode,
      regionName,
      joinedAt: new Date().toISOString(),
    };

    saveGroups([...currentGroups, newGroup]);
    return true;
  }, [user?.id, joinedGroups, saveGroups]);

  const leaveGroup = useCallback((regionCode: string) => {
    saveGroups(joinedGroups.filter(g => g.regionCode !== regionCode));
  }, [joinedGroups, saveGroups]);

  const isJoined = useCallback((regionCode: string) => {
    return joinedGroups.some(g => g.regionCode === regionCode);
  }, [joinedGroups]);

  const canJoinMore = joinedGroups.length < MAX_GROUPS;

  return {
    joinedGroups,
    joinGroup,
    leaveGroup,
    isJoined,
    canJoinMore,
    maxGroups: MAX_GROUPS,
    remainingSlots: MAX_GROUPS - joinedGroups.length,
    isInitialized,
    isLoading: authLoading || !isInitialized,
  };
};
