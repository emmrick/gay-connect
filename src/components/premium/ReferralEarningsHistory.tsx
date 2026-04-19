import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, Gift, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Lists all credit transactions tied to the referral system
 * (referral rewards + milestone bonuses).
 */
const ReferralEarningsHistory = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['referral-earnings', user?.id],
    queryFn: async () => {
      if (!user) return { items: [] as any[], total: 0 };
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, description, created_at, transaction_type')
        .eq('user_id', user.id)
        .eq('transaction_type', 'earn')
        .or('description.ilike.%parrainage%,description.ilike.%filleul%,description.ilike.%Palier parrainage%')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const items = data ?? [];
      const total = items.reduce((sum, t: any) => sum + Number(t.amount || 0), 0);
      return { items, total };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-3">
      {/* Total banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Total gagné
            </p>
            <p className="text-2xl font-heading font-bold tabular-nums">
              {total.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">crédits</span>
            </p>
          </div>
        </div>
        <Gift className="w-8 h-8 text-emerald-500/30" />
      </div>

      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Coins className="w-4 h-4 text-amber-500" />
        Historique
      </h4>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun gain pour le moment. Invitez vos amis pour commencer à gagner !
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {items.map((tx: any, i: number) => {
            const isMilestone = (tx.description || '').toLowerCase().includes('palier');
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isMilestone
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {isMilestone ? <TrendingUp className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{tx.description || 'Bonus parrainage'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(tx.created_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                  +{Number(tx.amount).toFixed(1)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReferralEarningsHistory;
