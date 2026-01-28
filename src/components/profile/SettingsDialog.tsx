import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Moon, Shield, HelpCircle, ExternalLink, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SettingsType = 'notifications' | 'appearance' | 'privacy' | 'help';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: SettingsType;
}

const SettingsDialog = ({ open, onOpenChange, type }: SettingsDialogProps) => {
  const { toast } = useToast();
  
  // Notifications settings
  const [pushEnabled, setPushEnabled] = useState(() => 
    localStorage.getItem('notifications_push') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState(() => 
    localStorage.getItem('notifications_sound') !== 'false'
  );
  const [messageNotifs, setMessageNotifs] = useState(() => 
    localStorage.getItem('notifications_messages') !== 'false'
  );

  // Appearance settings
  const [darkMode, setDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  const [reducedMotion, setReducedMotion] = useState(() => 
    localStorage.getItem('reduced_motion') === 'true'
  );

  // Privacy settings
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => 
    localStorage.getItem('show_online_status') !== 'false'
  );
  const [showLastSeen, setShowLastSeen] = useState(() => 
    localStorage.getItem('show_last_seen') !== 'false'
  );

  useEffect(() => {
    localStorage.setItem('notifications_push', String(pushEnabled));
    localStorage.setItem('notifications_sound', String(soundEnabled));
    localStorage.setItem('notifications_messages', String(messageNotifs));
  }, [pushEnabled, soundEnabled, messageNotifs]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('show_online_status', String(showOnlineStatus));
    localStorage.setItem('show_last_seen', String(showLastSeen));
  }, [showOnlineStatus, showLastSeen]);

  const handleSave = () => {
    toast({
      title: 'Paramètres enregistrés',
      description: 'Vos préférences ont été mises à jour.',
    });
    onOpenChange(false);
  };

  const getDialogContent = () => {
    switch (type) {
      case 'notifications':
        return {
          title: 'Notifications',
          description: 'Gérez vos préférences de notification',
          icon: <Bell className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications sur votre appareil
                  </p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sons de notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Jouer un son lors des nouvelles notifications
                  </p>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nouveaux messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Être notifié des nouveaux messages privés
                  </p>
                </div>
                <Switch checked={messageNotifs} onCheckedChange={setMessageNotifs} />
              </div>
            </div>
          ),
        };

      case 'appearance':
        return {
          title: 'Apparence',
          description: 'Personnalisez l\'apparence de l\'application',
          icon: <Moon className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le thème sombre
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réduire les animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Désactiver les animations pour une meilleure accessibilité
                  </p>
                </div>
                <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
              </div>
            </div>
          ),
        };

      case 'privacy':
        return {
          title: 'Confidentialité',
          description: 'Contrôlez qui peut voir vos informations',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Statut en ligne</Label>
                  <p className="text-sm text-muted-foreground">
                    Montrer quand vous êtes en ligne
                  </p>
                </div>
                <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dernière connexion</Label>
                  <p className="text-sm text-muted-foreground">
                    Montrer votre dernière date de connexion
                  </p>
                </div>
                <Switch checked={showLastSeen} onCheckedChange={setShowLastSeen} />
              </div>
            </div>
          ),
        };

      case 'help':
        return {
          title: 'Aide & Support',
          description: 'Besoin d\'aide ? Contactez-nous',
          icon: <HelpCircle className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-4 space-y-3">
                <h4 className="font-semibold">Questions fréquentes</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Comment modifier mon profil ?</strong><br />
                  Allez dans l'onglet Profil et cliquez sur "Modifier le profil".</p>
                  <p><strong>Comment démarrer une conversation ?</strong><br />
                  Cliquez sur le profil d'un membre ou utilisez le bouton + dans Messages.</p>
                  <p><strong>Comment signaler un utilisateur ?</strong><br />
                  Dans une conversation, utilisez l'option de signalement disponible.</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-semibold">Nous contacter</h4>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  support@gayconnect.app
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat en direct
                </Button>
              </div>
            </div>
          ),
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogContent.icon}
            {dialogContent.title}
          </DialogTitle>
          <DialogDescription>
            {dialogContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {dialogContent.content}
        </div>
        
        {type !== 'help' && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
