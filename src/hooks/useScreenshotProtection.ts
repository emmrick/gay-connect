import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ScreenshotViolation {
  count: number;
  suspendedUntil: Date | null;
}

export const useScreenshotProtection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isBlocked, setIsBlocked] = useState(false);
  const blockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch violations from database
  const { data: dbViolation } = useQuery({
    queryKey: ['screenshot-violations', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('screenshot_violations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate suspension status
  const isSuspended = useCallback(() => {
    if (!dbViolation?.suspended_until) return false;
    return new Date() < new Date(dbViolation.suspended_until);
  }, [dbViolation]);

  // Record violation mutation
  const recordViolation = useMutation({
    mutationFn: async (mediaId?: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('screenshot_violations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let newCount = 1;
      let suspendedUntil: Date | null = null;

      if (existing) {
        newCount = existing.violation_count + 1;
      }

      // Calculate suspension duration based on violation count
      if (newCount === 1) {
        // First violation: 10 minutes
        suspendedUntil = new Date(Date.now() + 10 * 60 * 1000);
      } else if (newCount === 2) {
        // Second violation: 10 hours
        suspendedUntil = new Date(Date.now() + 10 * 60 * 60 * 1000);
      } else if (newCount >= 3) {
        // Third+ violation: 1 month
        suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      if (existing) {
        const { error } = await supabase
          .from('screenshot_violations')
          .update({
            violation_count: newCount,
            suspended_until: suspendedUntil?.toISOString(),
            last_violation_at: new Date().toISOString(),
            media_id: mediaId || existing.media_id,
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('screenshot_violations')
          .insert({
            user_id: user.id,
            violation_count: newCount,
            suspended_until: suspendedUntil?.toISOString(),
            last_violation_at: new Date().toISOString(),
            media_id: mediaId,
          });

        if (error) throw error;
      }

      return { count: newCount, suspendedUntil };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshot-violations', user?.id] });
    },
  });

  const handleViolation = useCallback((mediaId?: string) => {
    // Immediately block content (make it black)
    setIsBlocked(true);
    
    // Record violation in database
    recordViolation.mutate(mediaId);

    // Keep content blocked for 5 seconds then check suspension
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }
    blockTimeoutRef.current = setTimeout(() => {
      setIsBlocked(false);
    }, 5000);
  }, [recordViolation]);

  // Detect screenshot attempts (keyboard shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen, Cmd+Shift+3/4 (Mac), Windows+PrintScreen, etc.
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.key === 'PrintScreen') ||
        (e.metaKey && e.key === 'PrintScreen')
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation();
        return false;
      }
    };

    // Detect when window loses focus (potential screenshot on mobile or screen recording)
    const handleBlur = () => {
      // Only trigger if content is currently being viewed
      // This is a heuristic - not always a screenshot
    };

    // Detect visibility changes (user switching apps - potential screenshot)
    const handleVisibilityChange = () => {
      // Could be combined with other signals for mobile detection
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (blockTimeoutRef.current) {
        clearTimeout(blockTimeoutRef.current);
      }
    };
  }, [handleViolation]);

  // Disable right-click on protected content
  const preventContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Prevent drag operations
  const preventDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const getSuspensionTimeLeft = useCallback(() => {
    if (!dbViolation?.suspended_until) return null;
    const suspendedUntil = new Date(dbViolation.suspended_until);
    const now = new Date();
    if (now >= suspendedUntil) return null;
    
    const diff = suspendedUntil.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutes`;
  }, [dbViolation?.suspended_until]);

  return {
    isSuspended: isSuspended(),
    isBlocked, // Immediate visual block on screenshot attempt
    violationCount: dbViolation?.violation_count || 0,
    suspendedUntil: dbViolation?.suspended_until ? new Date(dbViolation.suspended_until) : null,
    getSuspensionTimeLeft,
    preventContextMenu,
    preventDrag,
    handleViolation,
  };
};
