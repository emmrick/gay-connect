import { Crown, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
  onUpgrade?: () => void;
}

const UpgradePrompt = ({ feature, description, compact = false, onUpgrade }: UpgradePromptProps) => {
  const { startCheckout } = useSubscription();

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
    }
    await startCheckout();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-sm flex-1">{feature} - réservé aux membres Premium</span>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs"
          onClick={handleUpgrade}
        >
          <Crown className="w-3 h-3 mr-1" />
          Débloquer
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <Crown className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Fonctionnalité Premium
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4">
          {description || `${feature} est réservé aux membres Premium. Débloquez toutes les fonctionnalités pour seulement 4,50 €/mois !`}
        </p>
        
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          onClick={handleUpgrade}
        >
          <Crown className="w-4 h-4 mr-2" />
          Passer à Premium
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
