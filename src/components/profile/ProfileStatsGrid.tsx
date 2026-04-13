import { MessageCircle, Users, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileStatsGridProps {
  stats: { messagesCount: number; conversationsCount: number; reactionsCount: number } | undefined;
  statsLoading: boolean;
  favoritesCount: number;
}

const items = [
  { key: 'messages', label: 'Messages', icon: MessageCircle, gradient: 'from-primary/15 to-accent/10', color: 'text-primary', iconBg: 'bg-primary/15' },
  { key: 'convs', label: 'Convs', icon: Users, gradient: 'from-blue-500/15 to-cyan-500/10', color: 'text-blue-500', iconBg: 'bg-blue-500/15' },
  { key: 'favoris', label: 'Favoris', icon: Star, gradient: 'from-amber-500/15 to-orange-500/10', color: 'text-amber-500', iconBg: 'bg-amber-500/15' },
  { key: 'reactions', label: 'Réactions', icon: Heart, gradient: 'from-pink-500/15 to-rose-500/10', color: 'text-pink-500', iconBg: 'bg-pink-500/15' },
] as const;

const ProfileStatsGrid = ({ stats, statsLoading, favoritesCount }: ProfileStatsGridProps) => {
  const values: Record<string, number> = {
    messages: stats?.messagesCount || 0,
    convs: stats?.conversationsCount || 0,
    favoris: favoritesCount,
    reactions: stats?.reactionsCount || 0,
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.08 }}
      className="grid grid-cols-4 gap-2.5"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.04 }}
          className={`bg-gradient-to-br ${item.gradient} backdrop-blur-sm rounded-2xl border border-border/30 p-3 text-center shadow-sm`}
        >
          <div className={`w-8 h-8 rounded-lg ${item.iconBg} backdrop-blur-sm flex items-center justify-center mx-auto mb-1.5`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </div>
          <p className={`text-lg font-display font-bold ${item.color} leading-none`}>
            {statsLoading && item.key !== 'favoris' ? '·' : values[item.key]}
          </p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">{item.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProfileStatsGrid;
