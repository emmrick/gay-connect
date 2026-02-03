import { useEffect } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInvestigationNotifications, useAcknowledgeInvestigation } from '@/hooks/useAIModeration';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const InvestigationNoticeDialog = () => {
  const { data: notifications } = useInvestigationNotifications();
  const acknowledgeNotification = useAcknowledgeInvestigation();

  // Find the first unacknowledged notification
  const activeNotification = notifications?.find((n) => !n.acknowledged);

  const handleAcknowledge = () => {
    if (activeNotification) {
      acknowledgeNotification.mutate(activeNotification.id);
    }
  };

  if (!activeNotification) return null;

  const expiresIn = formatDistanceToNow(
    new Date(activeNotification.data_access_expires_at),
    { locale: fr }
  );

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="w-5 h-5" />
            Information importante
          </DialogTitle>
          <DialogDescription className="sr-only">
            Notification concernant une investigation en cours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <Shield className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p>
                Suite à un signalement concernant un utilisateur avec lequel vous avez
                communiqué, certaines de vos conversations peuvent être temporairement
                consultées par notre équipe de modération.
              </p>
              <p className="text-muted-foreground">
                Cette mesure est prise pour assurer la sécurité de notre communauté et
                comprendre ce qui s'est passé.
              </p>
            </div>
          </div>

          <div className="text-sm space-y-2">
            <p>
              <strong>Vos données seront traitées avec respect.</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Seules les conversations des 48 dernières heures sont consultées</li>
              <li>L'accès expire dans {expiresIn}</li>
              <li>Les données seront supprimées après l'analyse</li>
              <li>Aucune information ne sera partagée publiquement</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Si vous avez des questions ou des informations à partager concernant cette
            investigation, contactez notre support.
          </p>

          <Button 
            onClick={handleAcknowledge} 
            className="w-full"
            disabled={acknowledgeNotification.isPending}
          >
            J'ai compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestigationNoticeDialog;
