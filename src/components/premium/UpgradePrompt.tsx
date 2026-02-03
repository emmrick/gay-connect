import { Coins, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
  onUpgrade?: () => void;
}

const UpgradePrompt = ({ feature, description, compact = false, onUpgrade }: UpgradePromptProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    navigate('/?tab=credits');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
        <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm flex-1">{feature} - nécessite des crédits</span>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs"
          onClick={handleUpgrade}
        >
          <Coins className="w-3 h-3 mr-1" />
          Acheter
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <Coins className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Crédits requis
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4">
          {description || `${feature} nécessite des crédits. Rechargez votre solde pour profiter de toutes les fonctionnalités !`}
        </p>
        
        <Button 
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          onClick={handleUpgrade}
        >
          <Coins className="w-4 h-4 mr-2" />
          Acheter des crédits
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
