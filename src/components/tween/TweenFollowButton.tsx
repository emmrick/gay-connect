import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTweenFollowStatus, useToggleTweenFollow } from '@/hooks/useTweenFollows';

interface TweenFollowButtonProps {
  targetUserId: string;
  /** "compact" = petit pill à côté du nom; "full" = bouton plus visible */
  variant?: 'compact' | 'full';
  className?: string;
}

const TweenFollowButton = ({ targetUserId, variant = 'compact', className }: TweenFollowButtonProps) => {
  const { user } = useAuth();
  const { data, isLoading } = useTweenFollowStatus(targetUserId);
  const toggle = useToggleTweenFollow();

  // Pas de bouton sur son propre profil ni si non connecté
  if (!user || user.id === targetUserId) return null;

  const isFollowing = !!data?.isFollowing;
  const pending = toggle.isPending || isLoading;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    toggle.mutate({ targetUserId, isFollowing });
  };

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        disabled={pending}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all flex-shrink-0',
          isFollowing
            ? 'bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive border border-primary/20'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
          className,
        )}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-3 h-3" />
            <span>Suivi</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" />
            <span>Suivre</span>
          </>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all',
        isFollowing
          ? 'bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive border border-border'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        className,
      )}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Abonné(e)
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Suivre
        </>
      )}
    </motion.button>
  );
};

export default TweenFollowButton;
