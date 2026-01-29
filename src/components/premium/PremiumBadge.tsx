import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumBadgeProps {
  showIfNotPremium?: boolean;
  className?: string;
}

const PremiumBadge = ({ showIfNotPremium = false, className = '' }: PremiumBadgeProps) => {
  const { isPremium } = useSubscription();

  if (!isPremium && !showIfNotPremium) return null;

  if (isPremium) {
    return (
      <Badge className={`bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg ${className}`}>
        <Crown className="w-3 h-3 mr-1" />
        Premium
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
