import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, Link2, Copy, UserPlus, UserMinus, MessageSquare, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CoupleSettings = () => {
  const { user } = useAuth();
  const { coupleAccount, isCouple, partnerProfile, refetchCouple } = useActiveProfile();
  const [isCreating, setIsCreating] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const isOwner = coupleAccount?.owner_user_id === user?.id;

  const handleCreateCouple = async () => {
    if (!user?.id) return;
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('couple_accounts')
        .insert({ owner_user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Update own profile
      await supabase
        .from('profiles')
        .update({ couple_account_id: data.id, couple_role: 'owner' })
        .eq('user_id', user.id);

      await refetchCouple();
      toast.success('Compte couple créé ! Partagez le code d\'invitation avec votre partenaire.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!inviteCode.trim()) {
      toast.error('Entrez un code d\'invitation');
      return;
    }
    setIsJoining(true);
    try {
      const { data, error } = await supabase.rpc('join_couple_by_code', {
        _invite_code: inviteCode.trim(),
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Erreur');

      await refetchCouple();
      toast.success('Vous avez rejoint le compte couple !');
      setInviteCode('');
    } catch (error: any) {
      toast.error(error.message || 'Code invalide');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDissolve = async () => {
    if (!coupleAccount) return;
    setIsDissolving(true);
    try {
      const { data, error } = await supabase.rpc('dissolve_couple', {
        _couple_account_id: coupleAccount.id,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Erreur');

      sessionStorage.removeItem('gc_active_profile');
      sessionStorage.removeItem('gc_profile_selected');
      await refetchCouple();
      toast.success('Compte couple dissous');
      setShowDissolveConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    } finally {
      setIsDissolving(false);
    }
  };

  const handleToggleShareConversations = async (value: boolean) => {
    if (!coupleAccount || !isOwner) return;
    try {
      const { error } = await supabase
        .from('couple_accounts')
        .update({ share_conversations: value })
        .eq('id', coupleAccount.id);

      if (error) throw error;
      await refetchCouple();
      toast.success(value ? 'Conversations partagées activées' : 'Conversations privées restaurées');
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  const copyInviteLink = () => {
    if (!coupleAccount) return;
    const link = `${window.location.origin}/auth?couple=${coupleAccount.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien d\'invitation copié !');
  };

  // Not in a couple - show create/join options
  if (!coupleAccount || coupleAccount.status === 'dissolved') {
    return (
      <div className="space-y-6">
        <div className="text-center p-6">
          <Heart className="w-12 h-12 mx-auto text-pink-500 mb-3" />
          <h3 className="font-semibold text-lg">Compte Couple</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Partagez un compte avec votre partenaire pour des crédits communs
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleCreateCouple}
            disabled={isCreating}
            className="w-full"
            variant="hero"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Créer un compte couple
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Rejoindre un couple existant</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Code d'invitation"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleJoinCouple} disabled={isJoining}>
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending couple (waiting for partner)
  if (coupleAccount.status === 'pending') {
    return (
      <div className="space-y-6">
        <div className="text-center p-6">
          <Heart className="w-12 h-12 mx-auto text-pink-500 mb-3 animate-pulse" />
          <h3 className="font-semibold text-lg">En attente de votre partenaire</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Partagez ce code ou lien avec votre partenaire
          </p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <Label className="text-xs text-muted-foreground">Code d'invitation</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background px-3 py-2 rounded-lg text-sm font-mono border">
              {coupleAccount.invite_code}
            </code>
            <Button size="sm" variant="outline" onClick={copyInviteLink}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDissolve}
          disabled={isDissolving}
          className="w-full"
        >
          {isDissolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserMinus className="w-4 h-4 mr-2" />}
          Annuler
        </Button>
      </div>
    );
  }

  // Active couple
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
        <Heart className="w-6 h-6 text-pink-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Compte Couple Actif</p>
          <p className="text-xs text-muted-foreground">
            Partenaire : {partnerProfile?.username || 'Utilisateur'}
          </p>
        </div>
      </div>

      {/* Share conversations toggle */}
      {isOwner && (
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Partager les conversations</p>
              <p className="text-xs text-muted-foreground">Les deux profils voient toutes les conversations</p>
            </div>
          </div>
          <Switch
            checked={coupleAccount.share_conversations}
            onCheckedChange={handleToggleShareConversations}
          />
        </div>
      )}

      {!isOwner && coupleAccount.share_conversations && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <p className="text-sm">Les conversations sont partagées entre les deux profils</p>
        </div>
      )}

      {/* Dissolve */}
      <div className="pt-4 border-t">
        {!showDissolveConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDissolveConfirm(true)}
            className="w-full text-destructive hover:text-destructive"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Dissoudre le couple
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">Confirmer la dissolution ?</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Les profils resteront actifs mais seront indépendants. Les crédits resteront sur le compte propriétaire.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowDissolveConfirm(false)} className="flex-1">
                Annuler
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDissolve} disabled={isDissolving} className="flex-1">
                {isDissolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoupleSettings;
