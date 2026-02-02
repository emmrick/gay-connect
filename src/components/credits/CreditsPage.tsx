import { 
  Coins, 
  Gift, 
  ShoppingCart, 
  Users, 
  MessageCircle,
  Camera,
  FolderOpen,
  Heart,
  Eye,
  MapPin,
  ExternalLink,
  Loader2,
  Sparkles,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCredits, CREDIT_COSTS, CREDIT_REWARDS } from '@/hooks/useCredits';
import CreditBalanceBar from './CreditBalanceBar';
import DailyCreditsClaimCard from './DailyCreditsClaimCard';
import CreditHistorySheet from './CreditHistorySheet';
import CreditReferralSection from './CreditReferralSection';

// Revolut payment link for credits
const REVOLUT_CREDITS_LINK = 'https://checkout.revolut.com/pay/bd94a983-605b-47d8-b221-b4d9bf7da627';

interface CreditCostItemProps {
  icon: React.ReactNode;
  action: string;
  cost: number;
  description?: string;
}

const CreditCostItem = ({ icon, action, cost, description }: CreditCostItemProps) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <span className="text-sm font-medium">{action}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    <Badge variant="outline" className="text-xs">
      {cost} crédit{cost !== 1 ? 's' : ''}
    </Badge>
  </div>
);

const CreditsPage = () => {
  const { isLoading, totalCredits } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const creditCosts = [
    { icon: <MessageCircle className="w-4 h-4 text-primary" />, action: 'Message texte', cost: CREDIT_COSTS.private_message_text },
    { icon: <Camera className="w-4 h-4 text-primary" />, action: 'Photo/Vidéo simple', cost: CREDIT_COSTS.private_message_media },
    { icon: <Sparkles className="w-4 h-4 text-primary" />, action: 'Média éphémère', cost: CREDIT_COSTS.ephemeral_media },
    { icon: <Users className="w-4 h-4 text-primary" />, action: 'Message groupe (média)', cost: CREDIT_COSTS.group_message_media },
    { icon: <Eye className="w-4 h-4 text-primary" />, action: 'Consulter un profil', cost: CREDIT_COSTS.profile_view },
    { icon: <Heart className="w-4 h-4 text-primary" />, action: 'Réaction sur profil', cost: CREDIT_COSTS.profile_reaction },
    { icon: <FolderOpen className="w-4 h-4 text-primary" />, action: 'Partage d\'album', cost: CREDIT_COSTS.album_share },
    { icon: <FolderOpen className="w-4 h-4 text-primary" />, action: 'Créer un album (2ème+)', cost: CREDIT_COSTS.album_create },
    { icon: <MapPin className="w-4 h-4 text-primary" />, action: '+30 profils (72h)', cost: CREDIT_COSTS.nearby_unlock_30 },
    { icon: <MapPin className="w-4 h-4 text-primary" />, action: '+130 profils (7j)', cost: CREDIT_COSTS.nearby_unlock_130 },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-primary/10 to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.15),transparent_50%)]" />
        
        <div className="relative px-4 py-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-amber-500/30">
            <Coins className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold font-display mb-2">
            Mes <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Crédits</span>
          </h1>
          
          <p className="text-muted-foreground max-w-sm mx-auto">
            Utilisez des crédits pour interagir sur GayConnect
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Current Balance */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-bold">{totalCredits.toFixed(1)}</span>
                <span className="text-muted-foreground">crédits</span>
              </div>
              <CreditHistorySheet />
            </div>
            <CreditBalanceBar showLabel={false} />
          </CardContent>
        </Card>

        {/* Daily Credits Claim */}
        <DailyCreditsClaimCard />

        {/* Purchase Credits */}
        <Card className="border-2 border-sky-400/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            OFFRE
          </div>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-500" />
              Acheter des crédits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div>
              <span className="text-4xl font-bold">100</span>
              <span className="text-muted-foreground"> crédits</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-sky-500">5,99 €</span>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-semibold"
              onClick={() => window.open(REVOLUT_CREDITS_LINK, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Acheter avec Revolut
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Vos crédits seront ajoutés sous 24h après vérification du paiement.
            </p>
          </CardContent>
        </Card>

        {/* Free Credits Ways */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              Gagner des crédits gratuits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Inscription</span>
              <Badge className="bg-green-500">{CREDIT_REWARDS.signup} crédits</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Vérification d'identité</span>
              <Badge className="bg-green-500">{CREDIT_REWARDS.identity_verification} crédits</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Crédits quotidiens (7j/mois)</span>
              <Badge className="bg-green-500">{CREDIT_REWARDS.daily_claim} crédits/jour</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Parrainage réussi</span>
              <Badge className="bg-green-500">{CREDIT_REWARDS.referral_success} crédits</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <CreditReferralSection />

        {/* Credit Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coût des actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {creditCosts.map((item, index) => (
              <CreditCostItem key={index} {...item} />
            ))}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm">Comment fonctionnent les crédits ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Chaque action sur GayConnect consomme des crédits. Vous recevez 15 crédits à l'inscription et pouvez réclamer 5 crédits gratuits par jour (7 fois par mois).
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">Comment sont utilisés les crédits ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les crédits quotidiens sont utilisés en premier, puis les crédits bonus, et enfin les crédits achetés.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">Le premier album est-il gratuit ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Oui ! La création de votre premier album est gratuite. Les albums suivants coûtent 10 crédits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditsPage;
