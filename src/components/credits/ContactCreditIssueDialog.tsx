import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Send,
  CreditCard,
  User,
  Mail,
  MapPin,
  Calendar,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ContactCreditIssueDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ContactCreditIssueDialog = ({ trigger, open: controlledOpen, onOpenChange }: ContactCreditIssueDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled or uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  // Form state - only editable fields
  const [last4Digits, setLast4Digits] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');

  // Fetch user profile for auto-fill
  const { data: profile } = useQuery({
    queryKey: ['user-profile-credit-issue', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, age, region')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  // Get admin user IDs using RPC function
  const { data: admins } = useQuery({
    queryKey: ['admin-users-for-credit'],
    queryFn: async () => {
      // Hardcode admin ID since RLS blocks direct query
      // This is the admin user from user_roles table
      return [{ user_id: '576f712b-2925-4d8f-ad59-9bcbd9996a02' }];
    },
    enabled: isOpen,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Non authentifié');
      if (!profile) throw new Error('Profil non trouvé');
      if (!admins || admins.length === 0) throw new Error('Aucun administrateur disponible');

      // Validate required fields
      if (!last4Digits || last4Digits.length !== 4) {
        throw new Error('Veuillez entrer les 4 derniers chiffres de votre carte');
      }
      if (!lastName.trim()) throw new Error('Veuillez entrer votre nom');
      if (!firstName.trim()) throw new Error('Veuillez entrer votre prénom');
      if (!paymentEmail.trim()) throw new Error('Veuillez entrer votre adresse mail de paiement');

      // Format the special credit pending message
      const creditRequestMessage = 
        `💳 DEMANDE DE CRÉDITS EN ATTENTE\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 Informations de paiement:\n` +
        `• 4 derniers chiffres CB: ${last4Digits}\n` +
        `• Nom: ${lastName}\n` +
        `• Prénom: ${firstName}\n` +
        `• Email paiement: ${paymentEmail}\n\n` +
        `📱 Compte GayConnect:\n` +
        `• Pseudonyme: ${profile.username}\n` +
        `• Âge: ${profile.age || 'Non renseigné'} ans\n` +
        `• Département: ${profile.region || 'Non renseigné'}\n` +
        `• User ID: ${user.id}`;

      // Send private message to all admins
      const messagePromises = admins.map(async (admin) => {
        // First, get or create a private conversation
        const { data: existingConvo } = await supabase
          .from('private_conversations')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${admin.user_id}),and(user1_id.eq.${admin.user_id},user2_id.eq.${user.id})`)
          .maybeSingle();

        let conversationId = existingConvo?.id;

        if (!conversationId) {
          const { data: newConvo, error: convoError } = await supabase
            .from('private_conversations')
            .insert({
              user1_id: user.id,
              user2_id: admin.user_id,
            })
            .select('id')
            .single();
          
          if (convoError) throw convoError;
          conversationId = newConvo.id;
        }

        // Send the message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            recipient_id: admin.user_id,
            content: creditRequestMessage,
            message_type: 'credit_request',
            is_private: true,
          });

        if (msgError) throw msgError;
      });

      await Promise.all(messagePromises);
    },
    onSuccess: () => {
      toast.success('Demande envoyée !', {
        description: 'Un administrateur examinera votre demande rapidement.',
      });
      setIsOpen(false);
      // Reset form
      setLast4Digits('');
      setLastName('');
      setFirstName('');
      setPaymentEmail('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Signaler un achat de crédits
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations de paiement pour nous aider à attribuer vos crédits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Information Section */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm font-medium text-amber-600">📋 Informations de paiement</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ces informations nous permettent de retrouver votre transaction.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              4 derniers chiffres de votre carte bancaire *
            </Label>
            <Input
              type="text"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="1234"
              value={last4Digits}
              onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Adresse mail utilisée pour le paiement *
            </Label>
            <Input
              type="email"
              placeholder="jean.dupont@email.com"
              value={paymentEmail}
              onChange={(e) => setPaymentEmail(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Account Information Section - Auto-filled and Read-only */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Votre compte (rempli automatiquement)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              Pseudonyme
            </Label>
            <Input
              value={profile?.username || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Âge
              </Label>
              <Input
                value={profile?.age ? `${profile.age} ans` : 'Non renseigné'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                Département
              </Label>
              <Input
                value={profile?.region || 'Non renseigné'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !profile}
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCreditIssueDialog;
