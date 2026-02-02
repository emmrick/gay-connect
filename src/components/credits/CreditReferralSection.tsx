import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Copy, 
  CheckCircle, 
  Clock, 
  Share2, 
  Gift,
  Shield,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { CREDIT_REWARDS } from '@/hooks/useCredits';

interface ReferralInfo {
  id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
  referred_profile?: {
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const CreditReferralSection = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Get or create referral code
  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_or_create_referral_code', {
        _user_id: user.id,
      });

      if (error) throw error;
      return data as string;
    },
    enabled: !!user?.id,
  });

  // Get referrals for this user
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          status,
          created_at
        `)
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profiles for referred users
      const referredIds = data.map(r => r.referred_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, is_verified')
        .in('user_id', referredIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data.map(r => ({
        ...r,
        referred_profile: profileMap.get(r.referred_user_id),
      })) as ReferralInfo[];
    },
    enabled: !!user?.id,
  });

  const shareUrl = referralCode 
    ? `${window.location.origin}/auth?ref=${referralCode}` 
    : '';

  const copyToClipboard = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const shareLink = async () => {
    if (!referralCode) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins GayConnect !',
          text: `Inscris-toi sur GayConnect avec mon lien et gagne ${CREDIT_REWARDS.referral_success} crédits gratuits après vérification !`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const verifiedCount = referrals.filter(r => r.referred_profile?.is_verified).length;
  const pendingCount = referrals.filter(r => !r.referred_profile?.is_verified).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Parrainage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* How it works */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Comment ça marche ?</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</span>
              Partagez votre lien d'invitation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</span>
              Votre ami s'inscrit et vérifie son identité
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</span>
              Vous recevez chacun <span className="font-bold text-green-500">{CREDIT_REWARDS.referral_success} crédits</span> !
            </li>
          </ul>
        </div>

        {/* Referral Code */}
        {codeLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : referralCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm truncate">
                {referralCode}
              </div>
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <Button 
              className="w-full" 
              onClick={shareLink}
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager mon lien
            </Button>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-2xl font-bold text-green-500">{verifiedCount}</p>
            <p className="text-xs text-muted-foreground">Vérifiés</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
        </div>

        {/* Referrals list */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Mes filleuls</p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        {referral.referred_profile?.avatar_url ? (
                          <AvatarImage src={referral.referred_profile.avatar_url} />
                        ) : (
                          <AvatarFallback>
                            {referral.referred_profile?.username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium">
                        {referral.referred_profile?.username || 'Utilisateur'}
                      </span>
                    </div>
                    {referral.referred_profile?.is_verified ? (
                      <Badge className="bg-green-500 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditReferralSection;
