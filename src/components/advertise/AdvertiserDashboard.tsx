import { Megaphone, ArrowLeft, Wallet, CreditCard, Eye, MousePointerClick, BarChart3, Pause, Play, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdvertiserStatsChart } from '@/components/ads/AdvertiserStatsChart';
import { placementLabels, statusConfig } from './constants';

interface DashboardProps {
  email: string;
  wallet: any;
  campaigns: any[];
  deposits: any[];
  onTopup: () => void;
  onEditAd: (ad: any) => void;
  onUpdateAd: (id: string, updates: any) => void;
  onLogout: () => void;
  onNewCampaign: () => void;
  onBack: () => void;
}

const AdvertiserDashboard = ({
  email,
  wallet,
  campaigns,
  deposits,
  onTopup,
  onEditAd,
  onUpdateAd,
  onLogout,
  onNewCampaign,
  onBack,
}: DashboardProps) => {
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks_count || 0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent_cents || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Espace Annonceurs</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mon espace annonceur</h2>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onNewCampaign} className="text-xs gap-1">
              <Megaphone className="w-3.5 h-3.5" /> Nouvelle campagne
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs">Déconnexion</Button>
          </div>
        </div>

        {/* Wallet + Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <Wallet className="w-5 h-5 text-primary mx-auto" />
              <p className="text-xl font-bold text-foreground">{((wallet?.balance_cents || 0) / 100).toFixed(2)}€</p>
              <p className="text-[10px] text-muted-foreground">Solde disponible</p>
              <Button size="sm" className="w-full mt-2 text-xs gap-1" onClick={onTopup}>
                <CreditCard className="w-3 h-3" /> Recharger
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <Eye className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Impressions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <MousePointerClick className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Clics</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-1">
              <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-foreground">{ctr}%</p>
              <p className="text-[10px] text-muted-foreground">Taux de clic (CTR)</p>
            </CardContent>
          </Card>
        </div>

        {/* Low balance warning */}
        {wallet && wallet.balance_cents < 500 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-600">Solde bas — vos annonces risquent d'être suspendues</p>
                <p className="text-[10px] text-muted-foreground">Rechargez votre portefeuille pour continuer la diffusion.</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs border-amber-500/30" onClick={onTopup}>Recharger</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="campaigns" className="text-xs">Campagnes ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Paiements</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-3 mt-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">Aucune campagne.</p>
                <Button onClick={onNewCampaign} className="gap-2">
                  <Megaphone className="w-4 h-4" /> Créer ma première campagne
                </Button>
              </div>
            ) : (
              campaigns.map((campaign) => {
                const budgetPct = campaign.budget_cents > 0
                  ? Math.min(100, ((campaign.spent_cents || 0) / campaign.budget_cents) * 100)
                  : 0;
                const sc = statusConfig[campaign.status] || statusConfig.pending;
                return (
                  <Card key={campaign.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 flex gap-3">
                          {campaign.image_url && (
                            <img src={campaign.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{campaign.title}</p>
                            {campaign.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{campaign.description}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{placementLabels[campaign.placement]?.label || campaign.placement}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          {campaign.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onUpdateAd(campaign.id, { is_active: !campaign.is_active })}
                              title={campaign.is_active ? 'Mettre en pause' : 'Activer'}
                            >
                              {campaign.is_active
                                ? <Pause className="w-3.5 h-3.5 text-amber-500" />
                                : <Play className="w-3.5 h-3.5 text-green-500" />}
                            </Button>
                          )}
                          {campaign.status !== 'rejected' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditAd(campaign)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {campaign.rejection_reason && (
                        <p className="text-xs text-red-500 bg-red-500/5 rounded-lg p-2">Motif : {campaign.rejection_reason}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-xs font-bold">{(campaign.impressions_count || 0).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Impressions</p></div>
                        <div><p className="text-xs font-bold">{(campaign.clicks_count || 0).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Clics</p></div>
                        <div><p className="text-xs font-bold">{((campaign.spent_cents || 0) / 100).toFixed(2)}€</p><p className="text-[10px] text-muted-foreground">Dépensé</p></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Budget consommé</span>
                          <span>{budgetPct.toFixed(0)}% ({((campaign.spent_cents || 0) / 100).toFixed(2)}€ / {((campaign.budget_cents || 0) / 100).toFixed(2)}€)</span>
                        </div>
                        <Progress value={budgetPct} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Historique des paiements</p>
              <Button size="sm" onClick={onTopup} className="text-xs gap-1"><CreditCard className="w-3 h-3" /> Recharger</Button>
            </div>
            {(!deposits || deposits.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement.</p>
            ) : (
              deposits.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{(d.amount_cents / 100).toFixed(2)}€</p>
                      <p className="text-[10px] text-muted-foreground">{d.payment_method} — {format(new Date(d.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                    </div>
                    <Badge variant="outline" className={d.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20 text-[10px]' : 'text-[10px]'}>
                      {d.status === 'completed' ? 'Payé' : d.status === 'pending' ? 'En cours' : 'Échoué'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h4 className="font-bold text-sm">Résumé global</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Total impressions</p><p className="font-bold">{totalImpressions.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Total clics</p><p className="font-bold">{totalClicks.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">CTR moyen</p><p className="font-bold">{ctr}%</p></div>
                  <div><p className="text-muted-foreground text-xs">Total dépensé</p><p className="font-bold">{(totalSpent / 100).toFixed(2)}€</p></div>
                  <div><p className="text-muted-foreground text-xs">Campagnes actives</p><p className="font-bold">{campaigns.filter((c) => c.status === 'approved' && c.is_active).length}</p></div>
                  <div><p className="text-muted-foreground text-xs">Solde restant</p><p className="font-bold">{((wallet?.balance_cents || 0) / 100).toFixed(2)}€</p></div>
                </div>
              </CardContent>
            </Card>

            <AdvertiserStatsChart campaignIds={campaigns.map((c) => c.id)} days={14} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
