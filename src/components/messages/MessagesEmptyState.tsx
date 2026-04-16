import { motion } from 'framer-motion';
import { Users, Globe2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessagesEmptyStateProps {
  variant: 'groups';
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

/**
 * Rich empty state for the Groups tab.
 * Conversations + archives empty states are already handled inside PrivateChatList.
 */
const MessagesEmptyState = ({
  variant,
  onPrimaryAction,
  onSecondaryAction,
}: MessagesEmptyStateProps) => {
  if (variant !== 'groups') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center px-8 py-14"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="relative w-24 h-24 mb-5"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Users className="w-11 h-11 text-primary" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-5 h-5 text-accent" />
        </motion.div>
      </motion.div>

      <h3 className="font-display font-semibold text-foreground text-lg mb-1.5">
        Aucun groupe rejoint
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-6">
        Rejoignez un groupe régional ou créez le vôtre pour discuter avec la communauté.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[320px]">
        {onPrimaryAction && (
          <Button onClick={onPrimaryAction} className="flex-1" size="default">
            <Globe2 className="w-4 h-4" />
            Rejoindre
          </Button>
        )}
        {onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" className="flex-1" size="default">
            <Users className="w-4 h-4" />
            Créer
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default MessagesEmptyState;
