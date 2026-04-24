import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ERROR_COOLDOWN_MS = 3000;

/**
 * Manage opt-in/opt-out for the weekly digest email.
 * Backed by `weekly_digest_unsubscribes`: presence of a row = opted out.
 */
export const useWeeklyDigestPreference = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const triggerCooldown = useCallback(() => {
    setIsCoolingDown(true);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsCoolingDown(false);
      cooldownTimerRef.current = null;
    }, ERROR_COOLDOWN_MS);
  }, []);

  const query = useQuery({
    queryKey: ['weekly-digest-unsubscribed', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('weekly_digest_unsubscribes')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error('Not authenticated');
      if (enabled) {
        // remove the opt-out row
        const { error } = await supabase
          .from('weekly_digest_unsubscribes')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // insert opt-out
        const { error } = await supabase
          .from('weekly_digest_unsubscribes')
          .insert({ user_id: user.id });
        if (error && !String(error.message).includes('duplicate')) throw error;
      }
    },
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-digest-unsubscribed', user?.id] });
      toast.success(enabled ? 'E-mails hebdomadaires activés' : 'E-mails hebdomadaires désactivés');
    },
    onError: (error: any) => {
      console.error('weekly digest pref error', error);
      const description =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Vérifie ta connexion et réessaie dans quelques secondes.';
      toast.error('Échec de la mise à jour', {
        description,
      });
      triggerCooldown();
    },
  });

  const enabled = !query.data; // not unsubscribed = enabled
  return {
    enabled,
    isLoading: query.isLoading,
    isUpdating: setEnabled.isPending || isCoolingDown,
    hasError: setEnabled.isError,
    toggle: () => {
      if (setEnabled.isPending || isCoolingDown) return;
      setEnabled.mutate(!enabled);
    },
  };
};
