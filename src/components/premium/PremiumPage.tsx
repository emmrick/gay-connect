import { useState } from 'react';
import { 
  Coins, 
  Check, 
  Camera, 
  Users, 
  MessageCircle, 
  Eye, 
  FolderOpen, 
  Loader2,
  Sparkles,
  ExternalLink,
  Gift,
  Heart,
  MapPin,
  Image,
  Share2,
  Clock,
  ShoppingCart,
  Timer,
  AlertTriangle,
  Zap,
  Shield,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCredits, CREDIT_COSTS, CREDIT_REWARDS } from '@/hooks/useCredits';
import { REVOLUT_PAYMENT_LINK } from '@/hooks/useSubscription';
import ReferralSection from './ReferralSection';
import CreditBalanceBar from '../credits/CreditBalanceBar';
import CreditHistorySheet from '../credits/CreditHistorySheet';
import ContactCreditIssueDialog from '../credits/ContactCreditIssueDialog';
import BuyCreditDialog from '../credits/BuyCreditDialog';

// Promotional offer
const PROMO_OFFER = {
  credits: 250,
  price: 10.99,
  originalPrice: 15.99,
  paymentLink: 'https://checkout.revolut.com/pay/45dd2e98-7ab4-40e7-ad01-5a64dedee6dd',
};

const CREDIT_PACKAGES_DISPLAY = [
  { credits: 50, price: '4,99 €' },
  { credits: 120, price: '9,99 €' },
  { credits: 300, price: '19,99 €' },
  { credits: 700, price: '39,99 €' },
];

const PremiumPage = () => {
  const { totalCredits, dailyCredits, bonusCredits, purchasedCredits, maxDailyCredits, isLoading } = useCredits();
  const [showContactDialog, setShowContactDialog] = useState(false);

  const handleBuyPromo = () => {
    window.open(PROMO_OFFER.paymentLink, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
        <div className="relative px-4 py-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent mb-3 shadow-lg shadow-primary/25">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display">
            Crédits <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">GayConnect</span>
          </h1>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* 🔥 LAUNCH PROMO BANNER */}
        <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          <div className="p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  🎉 Prix de lancement — Offre limitée !
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Les prix affichés sont <span className="font-semibold text-foreground">temporaires</span> et bien inférieurs aux tarifs définitifs. 
                  Profitez de cette promotion de lancement, valable pendant <span className="font-semibold text-foreground">1 an</span> à compter de l'ouverture du site.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card - Compact */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Solde actuel</p>
                  <p className="text-xl font-bold text-primary">{totalCredits.toFixed(1)}</p>
                </div>
              </div>
              <CreditHistorySheet />
            </div>
            <CreditBalanceBar showLabel={false} />
            
            {/* Mini stats inline */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center px-2 py-1.5 rounded-lg bg-green-500/10">
                <p className="text-sm font-bold text-green-600">{dailyCredits.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Quotidiens</p>
              </div>
              <div className="text-center px-2 py-1.5 rounded-lg bg-blue-500/10">
                <p className="text-sm font-bold text-blue-600">{bonusCredits.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Bonus</p>
              </div>
              <div className="text-center px-2 py-1.5 rounded-lg bg-sky-400/10">
                <p className="text-sm font-bold text-sky-500">{purchasedCredits.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Achetés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Offer - Compact */}
        <Card className="border-2 border-green-500/40 relative overflow-hidden bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">
            🔥 -31%
          </div>
          <CardContent className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  {PROMO_OFFER.credits} crédits
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-green-600">{PROMO_OFFER.price.toFixed(2).replace('.', ',')} €</span>
                  <span className="text-sm text-muted-foreground line-through">{PROMO_OFFER.originalPrice.toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />Sans expiration</span>
                  <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />Paiement sécurisé</span>
                </div>
              </div>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-semibold px-4"
                onClick={handleBuyPromo}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Acheter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Packages - Compact Grid + Buy Button */}
        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Tous les packs
              </p>
              <Badge variant="outline" className="text-[10px]">Prix de lancement</Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {CREDIT_PACKAGES_DISPLAY.map((pkg) => (
                <div key={pkg.credits} className="text-center p-2 rounded-lg bg-muted/50 border border-border">
                  <p className="text-base font-bold">{pkg.credits}</p>
                  <p className="text-[11px] text-muted-foreground">{pkg.price}</p>
                </div>
              ))}
            </div>
            <BuyCreditDialog 
              trigger={
                <Button className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Acheter des crédits
                </Button>
              }
            />
            <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Crédits ajoutés après validation admin · Sans expiration
            </p>
          </CardContent>
        </Card>

        {/* Contact credit issue - Inline */}
        <button 
          onClick={() => setShowContactDialog(true)}
          className="w-full text-center py-2.5 px-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
        >
          <p className="text-xs text-muted-foreground">
            Crédits achetés non reçus ? <span className="text-primary font-medium underline">Contacter un admin</span>
          </p>
        </button>

        <ContactCreditIssueDialog 
          open={showContactDialog} 
          onOpenChange={setShowContactDialog} 
        />

        {/* Free Credits - Compact */}
        <Card>
          <CardHeader className="pb-2 pt-3.5 px-3.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-500" />
              Gagner des crédits gratuits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5 space-y-1.5">
            {[
              { icon: <Zap className="w-4 h-4 text-green-500" />, label: 'Inscription', credits: CREDIT_REWARDS.signup, bg: 'bg-green-500/10' },
              { icon: <Shield className="w-4 h-4 text-blue-500" />, label: 'Vérification d\'identité', credits: CREDIT_REWARDS.identity_verification, bg: 'bg-blue-500/10' },
              { icon: <Clock className="w-4 h-4 text-amber-500" />, label: 'Crédits quotidiens (auto)', credits: CREDIT_REWARDS.daily_claim, bg: 'bg-amber-500/10', suffix: '/jour' },
              { icon: <Users className="w-4 h-4 text-purple-500" />, label: 'Parrainage réussi', credits: CREDIT_REWARDS.referral_success, bg: 'bg-purple-500/10', suffix: ' chacun' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-2 px-2.5 rounded-lg ${item.bg}`}>
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  +{item.credits}{item.suffix || ''}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Referral Section */}
        <ReferralSection />

        {/* Credit Costs - Collapsible */}
        <Card>
          <CardHeader className="pb-2 pt-3.5 px-3.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              Coût des actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5">
            <div className="space-y-0">
              {[
                { icon: <MessageCircle className="w-3.5 h-3.5 text-primary" />, label: 'Message texte', cost: CREDIT_COSTS.private_message_text },
                { icon: <Image className="w-3.5 h-3.5 text-primary" />, label: 'Photo/Vidéo', cost: CREDIT_COSTS.private_message_media },
                { icon: <Camera className="w-3.5 h-3.5 text-purple-500" />, label: 'Média éphémère', cost: CREDIT_COSTS.ephemeral_media },
                { icon: <Users className="w-3.5 h-3.5 text-primary" />, label: 'Média en groupe', cost: CREDIT_COSTS.group_message_media },
                { icon: <Eye className="w-3.5 h-3.5 text-primary" />, label: 'Consulter un profil', cost: CREDIT_COSTS.profile_view },
                { icon: <Heart className="w-3.5 h-3.5 text-pink-500" />, label: 'Réaction profil', cost: CREDIT_COSTS.profile_reaction },
                { icon: <Share2 className="w-3.5 h-3.5 text-primary" />, label: 'Partage d\'album', cost: CREDIT_COSTS.album_share },
                { icon: <FolderOpen className="w-3.5 h-3.5 text-amber-500" />, label: 'Créer album (2ème+)', cost: CREDIT_COSTS.album_create },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-{item.cost}</span>
                </div>
              ))}
            </div>
            
            <Separator className="my-2.5" />
            
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Déblocages Proximité</p>
            <div className="space-y-0">
              {[
                { label: '+30 profils (72h)', cost: CREDIT_COSTS.nearby_unlock_30 },
                { label: '+130 profils (7 jours)', cost: CREDIT_COSTS.nearby_unlock_130 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-{item.cost}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ - Accordion */}
        <Card>
          <CardHeader className="pb-2 pt-3.5 px-3.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              Questions fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how" className="border-b-0">
                <AccordionTrigger className="text-xs py-2.5">Comment fonctionne le système ?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-2">
                  Chaque action consomme des crédits. Vous recevez 15 crédits à l'inscription et 5 crédits gratuits automatiquement chaque jour. Ordre d'utilisation : Quotidiens → Bonus → Achetés.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="daily" className="border-b-0">
                <AccordionTrigger className="text-xs py-2.5">Les crédits quotidiens ?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-2">
                  5 crédits rechargés automatiquement chaque jour à minuit. Non cumulables — ils sont remplacés chaque jour.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="expiry" className="border-b-0">
                <AccordionTrigger className="text-xs py-2.5">Expiration des crédits ?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-2">
                  Les crédits achetés et bonus n'expirent jamais. Seuls les crédits quotidiens sont remplacés chaque jour.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="prices" className="border-b-0">
                <AccordionTrigger className="text-xs py-2.5">Pourquoi ces prix si bas ?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-2">
                  Il s'agit de nos tarifs de lancement, valables pendant 1 an. Les prix définitifs seront sensiblement plus élevés. Profitez-en maintenant !
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="referral" className="border-b-0">
                <AccordionTrigger className="text-xs py-2.5">Le parrainage ?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-2">
                  Partagez votre code. Quand votre filleul s'inscrit ET vérifie son identité, vous recevez 10 crédits chacun.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumPage;
