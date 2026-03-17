import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, Clock, CheckCircle, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'info' | 'confirm' | 'done'>('info');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');

  // Check if there's already a pending deletion request
  const { data: existingRequest, isLoading: checkingRequest } = useQuery({
    queryKey: ['deletion-request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('account_deletion_requests' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (error) return null;
      return data as any;
    },
    enabled: !!user && open,
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      });
      if (signInError) throw new Error('MOT_DE_PASSE_INCORRECT');

      // Create deletion request (upsert to handle re-requests)
      const { error } = await supabase
        .from('account_deletion_requests' as any)
        .upsert({
          user_id: user.id,
          reason: reason.trim() || null,
          status: 'pending',
          requested_at: new Date().toISOString(),
          scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelled_at: null,
          completed_at: null,
        } as any, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] });
    },
    onError: (error: any) => {
      if (error.message === 'MOT_DE_PASSE_INCORRECT') {
        toast.error('Mot de passe incorrect');
      } else {
        toast.error('Erreur lors de la demande de suppression');
      }
    },
  });

  const cancelDeletion = useMutation({
    mutationFn: async () => {
      if (!user || !existingRequest) throw new Error('No request');
      const { error } = await supabase
        .from('account_deletion_requests' as any)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] });
      toast.success('Demande de suppression annulée');
      handleClose();
    },
  });

  const handleClose = () => {
    setStep('info');
    setPassword('');
    setReason('');
    onOpenChange(false);
  };

  const getDaysRemaining = () => {
    if (!existingRequest?.scheduled_deletion_at) return 30;
    const diff = new Date(existingRequest.scheduled_deletion_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Existing pending request view
  if (existingRequest && !checkingRequest) {
    const daysLeft = getDaysRemaining();
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Suppression programmée
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                    Votre compte sera supprimé dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date prévue : {new Date(existingRequest.scheduled_deletion_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    <strong>💡 Pour annuler :</strong> Vous pouvez annuler cette demande à tout moment. 
                    Si vous vous connectez régulièrement, vos données seront automatiquement restaurées.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleClose}>Fermer</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => cancelDeletion.mutate()}
              disabled={cancelDeletion.isPending}
              className="border-green-500/30 text-green-600 hover:bg-green-500/10"
            >
              {cancelDeletion.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Annuler la suppression
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Done state
  if (step === 'done') {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Demande enregistrée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Votre compte sera définitivement supprimé dans <strong>30 jours</strong>.
            </p>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-left w-full">
              <p className="text-xs text-green-600 dark:text-green-400">
                <strong>🔄 Changement d'avis ?</strong> Connectez-vous simplement à votre compte 
                dans les 30 prochains jours et vos données seront automatiquement restaurées.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Compris
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Supprimer mon compte
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {step === 'info' ? (
                "Cette action programmera la suppression définitive de toutes vos données personnelles."
              ) : (
                "Confirmez votre identité pour procéder à la suppression."
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 'info' ? (
          <div className="space-y-4 py-2">
            {/* What will be deleted */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">Données supprimées :</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 pl-6 list-disc">
                <li>Profil et photos</li>
                <li>Messages privés et de groupe</li>
                <li>Albums et médias partagés</li>
                <li>Crédits et historique des transactions</li>
                <li>Favoris, réactions et préférences</li>
                <li>Données de vérification d'identité</li>
              </ul>
            </div>

            {/* 30-day grace period */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary">Délai de 30 jours</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Après votre demande, vous disposez de <strong>30 jours</strong> pour changer d'avis. 
                    Il vous suffit de vous reconnecter pour annuler automatiquement la suppression et restaurer toutes vos données.
                  </p>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <AlertDialogCancel onClick={handleClose}>Annuler</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Continuer
              </Button>
            </AlertDialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Security verification */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Pour votre sécurité, confirmez votre mot de passe avant de procéder.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-password">Mot de passe</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={requestDeletion.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-reason">Raison (optionnel)</Label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Dites-nous pourquoi vous partez..."
                rows={2}
                maxLength={500}
                disabled={requestDeletion.isPending}
                className="resize-none"
              />
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <AlertDialogCancel onClick={() => setStep('info')} disabled={requestDeletion.isPending}>
                Retour
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => requestDeletion.mutate()}
                disabled={!password.trim() || requestDeletion.isPending}
              >
                {requestDeletion.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirmer la suppression
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
