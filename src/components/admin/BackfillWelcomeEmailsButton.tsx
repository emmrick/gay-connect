import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BackfillWelcomeEmailsButton = () => {
  const [loading, setLoading] = useState(false);

  const handleBackfill = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('backfill_welcome_emails', { _days_back: 60 });
      if (error) throw error;
      const result = data as { success: boolean; queued: number };
      toast.success(`${result.queued} email(s) de bienvenue rattrapé(s) sur 60 jours`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du rattrapage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
          Rattraper emails bienvenue
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rattraper les emails de bienvenue ?</AlertDialogTitle>
          <AlertDialogDescription>
            Envoie un email de bienvenue à tous les utilisateurs inscrits dans les 60 derniers jours
            qui n'en ont pas reçu (suite au problème d'envoi). Les utilisateurs déjà notifiés
            ou désinscrits seront ignorés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleBackfill}>Lancer l'envoi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BackfillWelcomeEmailsButton;
