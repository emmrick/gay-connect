import { useState } from 'react';
import { Gift, Copy, Share2, Users, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferral } from '@/hooks/useReferral';

const ReferralSection = () => {
  const { 
    referralCode, 
    stats, 
    referrals, 
    myReferralStatus, 
    isLoading,
    copyReferralLink,
    shareReferralLink 
  } = useReferral();

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : '';

  return (
    <div className="space-y-4">
      {/* Si l'utilisateur a été parrainé, afficher son statut */}
      {myReferralStatus?.isReferred && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              Votre promotion parrainage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Parrainé par <span className="font-medium text-foreground">{myReferralStatus.referrerUsername}</span>
            </p>
            
            {myReferralStatus.rewardApplied ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">3 mois gratuits appliqués !</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progression vers les 3 mois gratuits</span>
                  <span className="font-medium">{myReferralStatus.consecutivePayments || 0}/3 paiements</span>
                </div>
                <Progress 
                  value={((myReferralStatus.consecutivePayments || 0) / 3) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Après 3 mois d'abonnement consécutifs, vous recevrez 3 mois gratuits !
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section principale de parrainage */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Parrainez vos amis</CardTitle>
              <CardDescription>
                Gagnez 3 mois gratuits pour chaque filleul
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Explication de l'offre */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Comment ça marche ?
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Partagez votre lien de parrainage</li>
              <li>Votre ami s'inscrit et s'abonne</li>
              <li>Après 3 mois d'abonnement consécutifs</li>
              <li><span className="text-primary font-medium">Vous recevez tous les deux 3 mois gratuits !</span></li>
            </ol>
          </div>

          {/* Code et lien de parrainage */}
          {referralCode && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-background border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Votre code</p>
                  <p className="font-mono font-bold text-lg">{referralCode}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stats?.total_referrals || 0} filleul{(stats?.total_referrals || 0) > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={copyReferralLink} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le lien
                </Button>
                <Button 
                  onClick={shareReferralLink}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (stats.total_referrals > 0 || stats.successful_referrals > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold">{stats.total_referrals}</p>
                <p className="text-xs text-muted-foreground">Filleuls inscrits</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">{stats.successful_referrals}</p>
                <p className="text-xs text-muted-foreground">Récompenses gagnées</p>
              </div>
            </div>
          )}

          {/* Liste des filleuls */}
          {referrals.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Vos filleuls</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {referral.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{referral.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.referrer_reward_applied ? (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          <Trophy className="w-3 h-3 mr-1" />
                          Récompensé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {referral.consecutive_payments}/3
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSection;
