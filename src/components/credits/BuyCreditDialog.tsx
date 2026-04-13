import { useState, useEffect } from 'react';
import {
  ShoppingCart, Coins, Sparkles, Check, Loader2, Zap, Crown, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreditOffer {
  id: string;
  credits: number;
  price_euros: number;
  original_price_euros: number | null;
  discount_percent: number | null;
  is_highlighted: boolean;
  is_active: boolean;
  label: string | null;
  display_order: number;
}

interface BuyCreditDialogProps {
  trigger?: React.ReactNode;
}

const BuyCreditDialog = ({ trigger }: BuyCreditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loadingPaypal, setLoadingPaypal] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const { data: offers = [], refetch } = useQuery({
    queryKey: ['credit-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_offers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as CreditOffer[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('credit-offers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_offers' }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handlePayPal = async (offer: CreditOffer) => {
    setLoadingPaypal(offer.id);
    try {
      const returnUrl = `${window.location.origin}/paypal-return`;
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: { credits: offer.credits, price: offer.price_euros, return_url: returnUrl },
      });
      if (error) throw error;
      if (data?.approve_url) {
        window.location.href = data.approve_url;
      } else {
        throw new Error('Aucun lien PayPal reçu');
      }
    } catch (err: any) {
      console.error('PayPal error:', err);
      toast.error('Erreur lors de la création du paiement PayPal');
    } finally {
      setLoadingPaypal(null);
    }
  };

  const getOfferIcon = (index: number, isHighlighted: boolean) => {
    if (isHighlighted) return <Crown className="w-5 h-5 text-amber-500" />;
    if (index === 0) return <Coins className="w-5 h-5 text-primary" />;
    if (index === 1) return <Zap className="w-5 h-5 text-primary" />;
    return <Gift className="w-5 h-5 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Acheter des crédits
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-border/60">
        {/* Premium gradient header */}
        <div
          className="px-6 pt-6 pb-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
          }}
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary-foreground font-heading text-lg">
              <Coins className="w-5 h-5" />
              Acheter des crédits
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70 text-xs">
              Paiement sécurisé via PayPal ou carte bancaire
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 pt-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {offers.map((offer, index) => (
              <motion.button
                key={offer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                type="button"
                onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all relative group",
                  offer.is_highlighted
                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
                    : selectedOffer === offer.id
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 hover:border-primary/25 hover:bg-muted/30'
                )}
              >
                {/* Discount badge */}
                {offer.discount_percent && offer.discount_percent > 0 && (
                  <div className="absolute -top-2.5 right-3">
                    <Badge className="bg-primary text-primary-foreground text-[10px] shadow-md font-bold">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      -{offer.discount_percent}%
                    </Badge>
                  </div>
                )}

                {/* Label badge */}
                {offer.label && (
                  <div className="absolute -top-2.5 left-3">
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {offer.label}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    offer.is_highlighted ? "bg-primary/15" : "bg-primary/10"
                  )}>
                    {getOfferIcon(index, offer.is_highlighted)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground font-heading">{offer.credits} crédits</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-lg font-extrabold tabular-nums",
                        offer.is_highlighted ? 'text-primary' : 'text-foreground'
                      )}>
                        {offer.price_euros.toFixed(2).replace('.', ',')} €
                      </span>
                      {offer.original_price_euros && (
                        <span className="text-xs text-muted-foreground line-through tabular-nums">
                          {offer.original_price_euros.toFixed(2).replace('.', ',')} €
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right tabular-nums font-medium">
                    {(offer.price_euros / offer.credits * 100).toFixed(1)}c
                    <br />
                    <span className="text-muted-foreground/60">/ crédit</span>
                  </div>
                </div>

                {/* Expanded pay section */}
                <AnimatePresence>
                  {selectedOffer === offer.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-3.5 border-t border-border/40">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePayPal(offer); }}
                          disabled={loadingPaypal !== null}
                          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#0070ba]/20 active:scale-[0.98]"
                        >
                          {loadingPaypal === offer.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.645h6.577c2.18 0 3.703.562 4.527 1.671.387.52.632 1.09.744 1.74.117.678.12 1.488.006 2.47l-.008.056v.488l.38.216c.32.177.578.38.777.612.332.388.548.876.64 1.449.095.585.064 1.264-.09 2.016-.178.862-.466 1.614-.855 2.23a4.676 4.676 0 0 1-1.337 1.39 5.11 5.11 0 0 1-1.744.773 8.484 8.484 0 0 1-2.146.246h-.51a1.54 1.54 0 0 0-1.522 1.302l-.026.15-.436 2.76-.02.107a.143.143 0 0 1-.04.09.136.136 0 0 1-.09.034z" />
                              </svg>
                              Payer {offer.price_euros.toFixed(2).replace('.', ',')} €
                            </>
                          )}
                        </button>
                        <div className="flex items-center justify-center gap-4 mt-2.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Crédits instantanés</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Sans expiration</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </AnimatePresence>

          {offers.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune offre disponible</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditDialog;
