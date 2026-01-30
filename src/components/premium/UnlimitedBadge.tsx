import { Infinity, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlimitedBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const UnlimitedBadge = ({ className, size = 'sm', showIcon = true }: UnlimitedBadgeProps) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30",
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {showIcon && <Infinity className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      <span>Illimité</span>
    </span>
  );
};

export default UnlimitedBadge;
