import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Loader2 } from 'lucide-react';
import TweenCard from './TweenCard';
import type { Tween } from '@/hooks/useTweens';
import { motion } from 'framer-motion';

interface MemberTweenSectionProps {
  userId: string;
  username: string;
}

const MemberTweenSection = ({ userId, username }: MemberTweenSectionProps) => {
  const { user } = useAuth();

  const { data: tweens, isLoading } = useQuery({
    queryKey: ['member-tweens', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tweens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data?.length) return [];

      // Enrich with profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .eq('user_id', userId)
        .single();

      // Check likes
      let likedIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('tween_likes')
          .select('tween_id')
          .eq('user_id', user.id)
          .in('tween_id', data.map(t => t.id));
        likedIds = new Set((likes || []).map(l => l.tween_id));
      }

      return data.map(t => ({
        ...t,
        has_poll: t.has_poll ?? false,
        likes_count: t.likes_count ?? 0,
        comments_count: t.comments_count ?? 0,
        profiles: profile || { user_id: userId, username, avatar_url: null },
        user_has_liked: likedIds.has(t.id),
      })) as Tween[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tweens?.length) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.45 }}
    >
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3" />
        Tweens de {username}
      </p>
      <div className="space-y-3">
        {tweens.map((tween) => (
          <TweenCard key={tween.id} tween={tween} />
        ))}
      </div>
    </motion.div>
  );
};

export default MemberTweenSection;
