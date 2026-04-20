import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { type Tween } from './useTweens';

async function enrichWithProfiles(items: any[]) {
  const userIds = [...new Set(items.map((i) => i.user_id))];
  if (!userIds.length) return items;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  return items.map((item) => ({
    ...item,
    profiles: profileMap.get(item.user_id) || null,
  }));
}

/** Liste des Tweens favoris de l'utilisateur courant */
export function useTweenFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tween-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [] as Tween[];

      const { data: favs, error } = await supabase
        .from('tween_favorites')
        .select('tween_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!favs?.length) return [] as Tween[];

      const tweenIds = favs.map((f) => f.tween_id);
      const { data: tweens, error: tweensErr } = await supabase
        .from('tweens')
        .select('*')
        .in('id', tweenIds)
        .eq('is_deleted', false);

      if (tweensErr) throw tweensErr;
      if (!tweens?.length) return [] as Tween[];

      const enriched = await enrichWithProfiles(tweens);

      // Préserver l'ordre par date d'ajout aux favoris
      const orderMap = new Map(favs.map((f, i) => [f.tween_id, i]));
      const ordered = [...enriched].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      );

      // Enrichir avec user_has_liked
      const { data: likes } = await supabase
        .from('tween_likes')
        .select('tween_id')
        .eq('user_id', user.id)
        .in('tween_id', tweenIds);
      const likedSet = new Set(likes?.map((l) => l.tween_id) || []);

      return ordered.map((t) => ({ ...t, user_has_liked: likedSet.has(t.id), is_favorited: true })) as Tween[];
    },
    enabled: !!user,
  });
}

/** Set des IDs favoris pour le user courant — utilisé pour afficher l'état de l'icône */
export function useTweenFavoriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tween-favorite-ids', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('tween_favorites')
        .select('tween_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set((data || []).map((d) => d.tween_id));
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

/** Toggle favori */
export function useToggleTweenFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tweenId, isFavorited }: { tweenId: string; isFavorited: boolean }) => {
      if (!user) throw new Error('Non connecté');
      if (isFavorited) {
        const { error } = await supabase
          .from('tween_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('tween_id', tweenId);
        if (error) throw error;
        return { added: false };
      }
      const { error } = await supabase
        .from('tween_favorites')
        .insert({ user_id: user.id, tween_id: tweenId });
      if (error) throw error;
      return { added: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tween-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['tween-favorite-ids'] });
      toast.success(result.added ? 'Ajouté à tes favoris' : 'Retiré des favoris');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Action impossible');
    },
  });
}
