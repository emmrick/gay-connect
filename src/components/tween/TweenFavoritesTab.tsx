import { useTweenFavorites } from '@/hooks/useTweenFavorites';
import TweenCard from './TweenCard';
import { Loader2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

const TweenFavoritesTab = () => {
  const { data, isLoading } = useTweenFavorites();
  const tweens = data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-primary/10 border border-accent/10 flex items-center justify-center backdrop-blur-sm"
        >
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </motion.div>
        <p className="text-sm text-muted-foreground font-medium">Chargement des favoris…</p>
      </div>
    );
  }

  if (!tweens.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-6"
      >
        <div className="w-20 h-20 mx-auto mb-5 rounded-[24px] bg-gradient-to-br from-accent/15 to-primary/10 border border-accent/10 flex items-center justify-center">
          <Bookmark className="w-10 h-10 text-accent/50" />
        </div>
        <p className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
          Aucun favori
        </p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          Touchez l'icône <Bookmark className="inline w-3.5 h-3.5 align-middle text-accent" /> sur un Tween pour le retrouver ici plus tard.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {tweens.map((tween, index) => (
        <motion.div
          key={tween.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.3 }}
        >
          <TweenCard tween={tween} />
        </motion.div>
      ))}
    </div>
  );
};

export default TweenFavoritesTab;
