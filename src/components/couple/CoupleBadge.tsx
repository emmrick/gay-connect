import { Heart } from 'lucide-react';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { cn } from '@/lib/utils';

interface CoupleBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

const CoupleBadge = ({ className, size = 'sm' }: CoupleBadgeProps) => {
  const { isCouple, activeProfile } = useActiveProfile();

  if (!isCouple) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className
      )}
    >
      <Heart className={cn('fill-current', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      {activeProfile?.username || 'Couple'}
    </span>
  );
};

export default CoupleBadge;
