import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Crown, 
  Search, 
  Loader2, 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_premium: boolean;
  region: string;
  created_at: string;
}

interface PremiumSubscription {
  id: string;
  user_id: string;
  activated_at: string;
  expires_at: string;
  payment_reference: string | null;
  notes: string | null;
  profiles: Profile;
}

const PremiumActivationPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all profiles for activation
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, is_premium, region, created_at')
        .order('username');

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch active premium subscriptions
  const { data: activeSubscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['admin-premium-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select(`
          id,
          user_id,
          activated_at,
          expires_at,
          payment_reference,
          notes,
          profiles!inner (
            user_id,
            username,
            avatar_url,
            is_premium,
            region,
            created_at
          )
        `)
        .order('expires_at', { ascending: true });

      if (error) throw error;
      return data as unknown as PremiumSubscription[];
    },
  });

  // Activate premium mutation
  const activateMutation = useMutation({
    mutationFn: async ({ userId, paymentRef, noteText }: { userId: string; paymentRef: string; noteText: string }) => {
      const { data, error } = await supabase.rpc('activate_premium', {
        _target_user_id: userId,
        _duration_days: 30,
        _payment_reference: paymentRef || null,
        _notes: noteText || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success('Premium activé avec succès !');
        queryClient.invalidateQueries({ queryKey: ['admin-premium-subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['admin-all-profiles'] });
        setIsActivateDialogOpen(false);
        setSelectedUser(null);
        setPaymentReference('');
        setNotes('');
      } else {
        toast.error(data?.error || 'Erreur lors de l\'activation');
      }
    },
    onError: (error) => {
      console.error('Error activating premium:', error);
      toast.error('Erreur lors de l\'activation du premium');
    },
  });

  // Revoke premium mutation
  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('revoke_premium', {
        _target_user_id: userId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success('Premium révoqué');
        queryClient.invalidateQueries({ queryKey: ['admin-premium-subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['admin-all-profiles'] });
      } else {
        toast.error(data?.error || 'Erreur lors de la révocation');
      }
    },
    onError: (error) => {
      console.error('Error revoking premium:', error);
      toast.error('Erreur lors de la révocation du premium');
    },
  });

  const filteredProfiles = profiles?.filter(profile =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nonPremiumProfiles = filteredProfiles?.filter(p => !p.is_premium);

  const handleActivate = () => {
    if (!selectedUser) return;
    activateMutation.mutate({
      userId: selectedUser.user_id,
      paymentRef: paymentReference,
      noteText: notes,
    });
  };

  const openActivateDialog = (user: Profile) => {
    setSelectedUser(user);
    setPaymentReference('');
    setNotes('');
    setIsActivateDialogOpen(true);
  };

  if (loadingProfiles || loadingSubscriptions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  const activeCount = activeSubscriptions?.filter(s => !isPast(new Date(s.expires_at))).length || 0;
  const expiredCount = activeSubscriptions?.filter(s => isPast(new Date(s.expires_at))).length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiredCount}</p>
            <p className="text-xs text-muted-foreground">Expirés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{nonPremiumProfiles?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Non-premium</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Abonnements actifs</TabsTrigger>
          <TabsTrigger value="activate">Activer Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          <ScrollArea className="h-[500px]">
            {!activeSubscriptions?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun abonnement premium</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubscriptions.map((sub) => (
                  <SubscriptionCard 
                    key={sub.id} 
                    subscription={sub} 
                    onRevoke={() => revokeMutation.mutate(sub.user_id)}
                    onRenew={() => openActivateDialog(sub.profiles)}
                    isRevoking={revokeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activate" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {!nonPremiumProfiles?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tous les utilisateurs ont déjà Premium</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nonPremiumProfiles.map((user) => (
                  <div 
                    key={user.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                        ) : (
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.region}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openActivateDialog(user)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Activer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Activate Dialog */}
      <Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Activer Premium
            </DialogTitle>
            <DialogDescription>
              Activer l'abonnement Premium pour {selectedUser?.username} pendant 30 jours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-ref">Référence de paiement (optionnel)</Label>
              <Input
                id="payment-ref"
                placeholder="Ex: Revolut #12345"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Notes internes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {activateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Activer Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SubscriptionCardProps {
  subscription: PremiumSubscription;
  onRevoke: () => void;
  onRenew: () => void;
  isRevoking: boolean;
}

const SubscriptionCard = ({ subscription, onRevoke, onRenew, isRevoking }: SubscriptionCardProps) => {
  const isExpired = isPast(new Date(subscription.expires_at));
  const expiresIn = formatDistanceToNow(new Date(subscription.expires_at), { 
    addSuffix: true, 
    locale: fr 
  });

  return (
    <div className={`p-4 rounded-lg border ${
      isExpired 
        ? 'border-destructive/30 bg-destructive/5' 
        : 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent'
    }`}>
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-amber-500/50">
          {subscription.profiles.avatar_url ? (
            <AvatarImage src={subscription.profiles.avatar_url} alt={subscription.profiles.username} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              {subscription.profiles.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{subscription.profiles.username}</p>
            {isExpired ? (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Expiré
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {isExpired ? 'Expiré' : 'Expire'} {expiresIn}
            </span>
          </div>

          {subscription.payment_reference && (
            <p className="text-xs text-muted-foreground mt-1">
              Réf: {subscription.payment_reference}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRenew}
            className="border-amber-500/50 hover:bg-amber-500/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={onRevoke}
            disabled={isRevoking}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumActivationPanel;
