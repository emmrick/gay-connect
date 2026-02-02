import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

interface CreditBalanceBarProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const CreditBalanceBar = ({ className, showLabel = true, compact = false }: CreditBalanceBarProps) => {
  const { dailyCredits, bonusCredits, purchasedCredits, totalCredits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-3 bg-muted rounded-full" />
      </div>
    );
  }

  // Calculate percentages for the stacked bar
  const total = Math.max(totalCredits, 1); // Avoid division by zero
  const dailyPercent = (dailyCredits / total) * 100;
  const bonusPercent = (bonusCredits / total) * 100;
  const purchasedPercent = (purchasedCredits / total) * 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{totalCredits.toFixed(1)} crédits</span>
          </div>
        </div>
      )}
      
      {/* Stacked progress bar */}
      <div className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted",
        compact ? "h-2" : "h-3"
      )}>
        {/* Daily credits - Green */}
        <div 
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
          style={{ width: `${dailyPercent}%` }}
        />
        
        {/* Bonus credits - Dark Blue */}
        <div 
          className="absolute top-0 h-full bg-blue-700 transition-all duration-300"
          style={{ 
            left: `${dailyPercent}%`,
            width: `${bonusPercent}%` 
          }}
        />
        
        {/* Purchased credits - Light Blue */}
        <div 
          className="absolute top-0 h-full bg-sky-400 transition-all duration-300"
          style={{ 
            left: `${dailyPercent + bonusPercent}%`,
            width: `${purchasedPercent}%` 
          }}
        />
      </div>

      {/* Legend */}
      {!compact && totalCredits > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {dailyCredits > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Quotidien: {dailyCredits.toFixed(1)}</span>
            </div>
          )}
          {bonusCredits > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-700" />
              <span>Bonus: {bonusCredits.toFixed(1)}</span>
            </div>
          )}
          {purchasedCredits > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Achetés: {purchasedCredits.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditBalanceBar;
