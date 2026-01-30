import { Crown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  showIfNotPremium?: boolean;
  className?: string;
}

const PremiumBadge = ({ showIfNotPremium = false, className = '' }: PremiumBadgeProps) => {
  const { isPremium, isVerifying, isLoading } = useSubscription();

  if (!isPremium && !showIfNotPremium) return null;

  if (isPremium) {
    return (
      <Badge className={cn(
        "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg relative overflow-hidden animate-pulse-glow",
        className
      )}>
        {/* Shine effect overlay */}
        <span 
          className="absolute inset-0 w-full h-full animate-shine"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            transform: 'skewX(-20deg)',
          }}
        />
        {isVerifying ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin relative z-10" />
        ) : (
          <Crown className="w-3 h-3 mr-1 relative z-10" />
        )}
        <span className="relative z-10">Premium</span>
      </Badge>
    );
  }

  // Show subtle loading state when checking premium status
  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Vérification...
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      Gratuit
    </Badge>
  );
};

export default PremiumBadge;
