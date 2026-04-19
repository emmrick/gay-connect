import { useEffect, useMemo, useState } from 'react';
import {
  Gift,
  Copy,
  Share2,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  QrCode as QrCodeIcon,
  Trophy,
  History,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useReferral } from '@/hooks/useReferral';
import { useDynamicCreditCosts } from '@/hooks/useDynamicCreditCosts';
import { useReferralMilestones } from '@/hooks/useReferralMilestones';
import ReferralMilestonesTrack from './ReferralMilestonesTrack';
import ReferralShareTemplates from './ReferralShareTemplates';
import ReferralEarningsHistory from './ReferralEarningsHistory';

const ReferralSection = () => {
  const {
    referralCode,
    stats,
    referrals,
    isLoading,
    copyReferralLink,
    shareReferralLink,
  } = useReferral();
  const { data: costs } = useDynamicCreditCosts();
  const referralReward = costs?.referral_reward ?? 30;
  const { milestones, unlockedIds, claim } = useReferralMilestones();

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const verifiedCount = stats?.successful_referrals ?? 0;

  // Auto-claim milestones when verified count changes
  useEffect(() => {
    if (verifiedCount > 0) {
      claim.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedCount]);

  const link = useMemo(() => {
    if (!referralCode) return '';
    return `${window.location.origin}/auth?ref=${referralCode}`;
  }, [referralCode]);

  const handleCopyLink = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast.success('Code copié !');
  };

  const qrUrl = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(link)}`
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 p-5"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(330 100% 60% / 0.08), hsl(45 100% 55% / 0.10))',
        }}
      >
        {/* shimmer */}
        <motion.div
          className="absolute -inset-x-full top-0 h-full w-[200%] pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 30%, hsl(var(--primary) / 0.10) 50%, transparent 70%)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-primary flex items-center justify-center shadow-lg">
              <Gift className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Programme de parrainage
              </p>
              <h2 className="text-xl font-heading font-bold leading-tight">
                Invitez. Gagnez. Répétez.
              </h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-bold text-foreground">+{referralReward} crédits</span> pour vous
            et votre ami à chaque vérification d'identité.
            <span className="text-primary font-medium"> Et des bonus paliers en plus !</span>
          </p>

          {/* Big stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <StatTile label="Filleuls" value={stats?.total_referrals ?? 0} icon={Users} />
            <StatTile
              label="Vérifiés"
              value={verifiedCount}
              icon={CheckCircle}
              accent="text-emerald-500"
            />
            <StatTile
              label="Paliers"
              value={`${unlockedIds.size}/${milestones.length}`}
              icon={Trophy}
              accent="text-amber-500"
            />
          </div>
        </div>
      </motion.div>

      {/* CODE & LINK CARD */}
      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-border/60 bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                Votre code
              </p>
              <button
                onClick={handleCopyCode}
                className="font-mono font-bold text-2xl tracking-wider text-primary hover:text-primary/80 transition-colors"
              >
                {referralCode}
              </button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={() => setShowQr((v) => !v)}
              aria-label="Afficher le QR code"
            >
              <QrCodeIcon className="w-4.5 h-4.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showQr && qrUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="p-3 rounded-2xl bg-white shadow-sm">
                    <img src={qrUrl} alt="QR code de parrainage" className="w-40 h-40" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Faites scanner ce code à votre ami
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Button onClick={handleCopyLink} variant="outline" className="flex-1 h-10 rounded-xl">
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5" />
              )}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
            <Button
              onClick={() => shareReferralLink(referralReward)}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Partager
            </Button>
          </div>
        </motion.div>
      )}

      {/* TABS */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-10 rounded-xl">
          <TabsTrigger value="progress" className="text-xs gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Paliers
          </TabsTrigger>
          <TabsTrigger value="share" className="text-xs gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Inviter
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1.5">
            <History className="w-3.5 h-3.5" />
            Gains
          </TabsTrigger>
        </TabsList>

        {/* PROGRESS / MILESTONES */}
        <TabsContent value="progress" className="space-y-4 pt-4">
          <ReferralMilestonesTrack
            milestones={milestones}
            unlockedIds={unlockedIds}
            verifiedCount={verifiedCount}
          />

          {/* How it works */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Comment ça marche ?
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Partagez votre lien ou code à un ami</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Il s'inscrit sur Gay Social avec votre code</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Il vérifie son identité (photo + selfie)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-500">✓</span>
                <span className="text-foreground font-medium">
                  Vous recevez tous les deux {referralReward} crédits, et vous progressez vers le
                  prochain palier !
                </span>
              </li>
            </ol>
          </div>

          {/* Referrals list */}
          {referrals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Vos filleuls ({referrals.length})
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                          {r.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {r.username || 'Utilisateur'}
                      </span>
                    </div>
                    {r.referrer_reward_applied ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                        <CheckCircle className="w-3 h-3" /> Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Clock className="w-3 h-3" /> En attente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* SHARE / TEMPLATES */}
        <TabsContent value="share" className="space-y-4 pt-4">
          <ReferralShareTemplates
            link={link}
            reward={referralReward}
            onNativeShare={() => shareReferralLink(referralReward)}
          />

          {/* Tips */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Astuces qui fonctionnent
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• <strong>Privilégiez le DM</strong> — un message direct convertit 5× mieux qu'un post</li>
              <li>• <strong>Personnalisez</strong> — ajoutez une phrase à vous au message pré-rédigé</li>
              <li>• <strong>Mentionnez la récompense</strong> — « +{referralReward} crédits gratuits » accroche</li>
              <li>• <strong>QR code en soirée</strong> — laissez vos amis scanner directement</li>
            </ul>
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="pt-4">
          <ReferralEarningsHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatTile = ({
  label,
  value,
  icon: Icon,
  accent = 'text-primary',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) => (
  <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 p-2.5 text-center">
    <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${accent}`} />
    <div className="text-lg font-heading font-bold tabular-nums leading-none">{value}</div>
    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
  </div>
);

export default ReferralSection;
