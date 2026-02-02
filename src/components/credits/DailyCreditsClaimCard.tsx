import { Gift, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCredits, CREDIT_REWARDS } from '@/hooks/useCredits';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DailyCreditsClaimCard = () => {
  const { 
    credits, 
    canClaimDaily, 
    dailyClaimsUsed, 
    claimDailyCredits,
    isLoading 
  } = useCredits();

  const maxClaims = 7;
  const claimsRemaining = maxClaims - dailyClaimsUsed;
  const progressPercent = (dailyClaimsUsed / maxClaims) * 100;

  const getNextClaimTime = () => {
    if (!credits?.last_daily_claim) return null;
    const lastClaim = new Date(credits.last_daily_claim);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    
    if (nextClaim <= new Date()) return null;
    
    return formatDistanceToNow(nextClaim, { addSuffix: true, locale: fr });
  };

  const nextClaimTime = getNextClaimTime();

  if (isLoading) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Crédits quotidiens</p>
              <p className="text-xs text-muted-foreground">
                {claimsRemaining} réclamation{claimsRemaining > 1 ? 's' : ''} restante{claimsRemaining > 1 ? 's' : ''} ce mois
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-500">+{CREDIT_REWARDS.daily_claim}</p>
            <p className="text-xs text-muted-foreground">crédits</p>
          </div>
        </div>

        {/* Monthly progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Utilisés ce mois</span>
            <span>{dailyClaimsUsed} / {maxClaims}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Claim button or status */}
        {dailyClaimsUsed >= maxClaims ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Limite mensuelle atteinte - Revenez le mois prochain
            </span>
          </div>
        ) : canClaimDaily ? (
          <Button 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            onClick={() => claimDailyCredits.mutate()}
            disabled={claimDailyCredits.isPending}
          >
            {claimDailyCredits.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Gift className="w-4 h-4 mr-2" />
            )}
            Réclamer {CREDIT_REWARDS.daily_claim} crédits
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Prochain crédit disponible {nextClaimTime}
            </span>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Les crédits quotidiens ne sont pas cumulables et doivent être réclamés chaque jour
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyCreditsClaimCard;
