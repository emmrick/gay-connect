import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BanIcon, Check, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AdFreeSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLANS = [
  {
    id: '7_weekly' as const,
    label: '7 jours',
    credits: 7,
    tag: 'Flexible',
    perDay: '1 crédit/jour',
  },
  {
    id: '15_biweekly' as const,
    label: '15 jours',
    credits: 15,
    tag: 'Populaire',
    perDay: '1 crédit/jour',
    popular: true,
  },
  {
    id: '30_once' as const,
    label: '30 jours',
    credits: 30,
    tag: 'Meilleur prix',
    perDay: '1 crédit/jour',
  },
];

const BENEFITS = [
  'Aucune publicité visible sur le site',
  'Navigation plus rapide et épurée',
  'Renouvellement flexible à tout moment',
];

const AdFreeSubscriptionDialog = ({ open, onOpenChange }: AdFreeSubscriptionDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>('15_biweekly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('subscribe_ad_free' as any, {
        _user_id: user.id,
        _plan: selectedPlan,
      });

      const result = data as any;
      if (error || !result?.success) {
        const msg = result?.error || error?.message || 'Erreur inconnue';
        if (msg.includes('Insufficient') || msg.includes('insuffisants')) {
          toast.error('Crédits insuffisants', { description: 'Rechargez votre solde pour souscrire.' });
        } else {
          toast.error(msg);
        }
        return;
      }

      toast.success('🎉 Abonnement sans pub activé !', {
        description: `Valable jusqu'au ${new Date(result.expires_at).toLocaleDateString('fr-FR')}`,
      });

      queryClient.invalidateQueries({ queryKey: ['ad-free-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la souscription');
    } finally {
      setIsLoading(false);
    }
  };

  const selected = PLANS.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <BanIcon className="w-4 h-4 text-primary" />
            </div>
            Navigation sans pub
          </DialogTitle>
          <DialogDescription className="text-sm">
            Profitez d'une expérience sans publicité en échange de crédits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Plans */}
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-center transition-all duration-200",
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 bg-card hover:border-border"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                    {plan.tag}
                  </span>
                )}
                <p className="text-lg font-bold text-foreground">{plan.credits}</p>
                <p className="text-[10px] text-muted-foreground font-medium">crédits</p>
                <p className="text-xs font-semibold text-foreground mt-1">{plan.label}</p>
              </motion.button>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-2 px-1">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Subscribe button */}
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Souscrire pour {selected?.credits} crédits
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            Les crédits seront déduits immédiatement. Pas de renouvellement automatique.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdFreeSubscriptionDialog;
