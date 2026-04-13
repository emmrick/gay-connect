import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Bell, Moon, Shield, HelpCircle,
  ChevronRight, Coins, LogOut, FileText, Scale, Ban, Lock, Trash2, Download, Megaphone, UserCheck, Heart
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SettingsDialog from './SettingsDialog';
import AlbumManager from '@/components/albums/AlbumManager';
import ProfileEditDialog from './ProfileEditDialog';
import BlockedUsersSheet from './BlockedUsersSheet';
import PinManagementSheet from '@/components/security/PinManagementSheet';
import DeleteAccountDialog from './DeleteAccountDialog';
import DataExportDialog from './DataExportDialog';
import ContactAgeFilterSheet from './ContactAgeFilterSheet';
import CoupleSettings from '@/components/couple/CoupleSettings';

type SettingsType = 'notifications' | 'appearance' | 'privacy' | 'help';

interface ProfileSettingsDrawerProps {
  isAdmin?: boolean;
  isModerator?: boolean;
  onNavigateToAdmin?: () => void;
  onNavigateToCredits?: () => void;
  onContactAdmin?: () => void;
  onSignOut: () => void;
}

const ProfileSettingsDrawer = ({
  isAdmin, isModerator, onNavigateToAdmin, onNavigateToCredits, onContactAdmin, onSignOut
}: ProfileSettingsDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<SettingsType | null>(null);
  const [showAlbumManager, setShowAlbumManager] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showPinManagement, setShowPinManagement] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showAgeFilter, setShowAgeFilter] = useState(false);
  const [showCoupleSettings, setShowCoupleSettings] = useState(false);

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => { setOpen(false); setSettingsType('notifications'); }, color: 'text-blue-500', bgColor: 'bg-blue-500/12' },
    { icon: Moon, label: 'Apparence', action: () => { setOpen(false); setSettingsType('appearance'); }, color: 'text-indigo-500', bgColor: 'bg-indigo-500/12' },
    { icon: Shield, label: 'Confidentialité', action: () => { setOpen(false); setSettingsType('privacy'); }, color: 'text-emerald-500', bgColor: 'bg-emerald-500/12' },
    { icon: Ban, label: 'Utilisateurs bloqués', action: () => { setOpen(false); setShowBlockedUsers(true); }, color: 'text-red-500', bgColor: 'bg-red-500/12' },
    { icon: UserCheck, label: 'Filtre d\'âge de contact', action: () => { setOpen(false); setShowAgeFilter(true); }, color: 'text-teal-500', bgColor: 'bg-teal-500/12' },
    { icon: HelpCircle, label: 'Aide & Support', action: () => { setOpen(false); setSettingsType('help'); }, color: 'text-orange-500', bgColor: 'bg-orange-500/12' },
    { icon: Lock, label: 'Code PIN & Sécurité', action: () => { setOpen(false); setShowPinManagement(true); }, color: 'text-violet-500', bgColor: 'bg-violet-500/12' },
    { icon: Heart, label: 'Compte Couple', action: () => { setOpen(false); setShowCoupleSettings(true); }, color: 'text-pink-500', bgColor: 'bg-pink-500/12' },
  ];

  const legalItems = [
    { icon: Scale, label: 'Mentions légales', section: 'legal', color: 'text-slate-500', bgColor: 'bg-slate-500/12' },
    { icon: FileText, label: 'CGU & CGV', section: 'cgu', color: 'text-cyan-500', bgColor: 'bg-cyan-500/12' },
    { icon: Shield, label: 'RGPD & Confidentialité', section: 'privacy', color: 'text-green-500', bgColor: 'bg-green-500/12' },
  ];

  return (
    <>
      <ProfileEditDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      <AlbumManager isOpen={showAlbumManager} onClose={() => setShowAlbumManager(false)} />
      <BlockedUsersSheet open={showBlockedUsers} onOpenChange={setShowBlockedUsers} />
      <PinManagementSheet open={showPinManagement} onOpenChange={setShowPinManagement} />
      <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
      <DataExportDialog open={showDataExport} onOpenChange={setShowDataExport} />
      <ContactAgeFilterSheet open={showAgeFilter} onOpenChange={setShowAgeFilter} />

      <Sheet open={showCoupleSettings} onOpenChange={setShowCoupleSettings}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl bg-card/95 backdrop-blur-xl border-border/30">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-display font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Gestion du Couple
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full pb-20">
            <CoupleSettings />
          </div>
        </SheetContent>
      </Sheet>
      
      {settingsType && (
        <SettingsDialog 
          open={!!settingsType} 
          onOpenChange={(open) => !open && setSettingsType(null)}
          type={settingsType}
          onContactAdmin={onContactAdmin}
        />
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" size="icon" 
            className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-xl shadow-lg border border-border/30 hover:bg-card/80 hover:scale-105 transition-all"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0 bg-card/95 backdrop-blur-xl border-border/30">
          <SheetHeader className="px-6 pb-4">
            <SheetTitle className="text-xl font-display font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Paramètres & Options
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto h-full pb-20 px-4">
            {/* Menu Items */}
            <div className="space-y-1.5">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-secondary/40 hover:bg-secondary/60 backdrop-blur-sm transition-all active:scale-[0.98] border border-transparent hover:border-border/20"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} backdrop-blur-sm flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>

            {/* Legal */}
            <Separator className="my-4 opacity-50" />
            <div className="mb-2 px-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-3.5 h-3.5" />
                Règlement & Légal
              </h3>
            </div>
            <div className="space-y-1.5">
              {legalItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => { setOpen(false); navigate(`/legal#${item.section}`); }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 backdrop-blur-sm transition-all active:scale-[0.98]"
                >
                  <div className={`w-9 h-9 rounded-lg ${item.bgColor} backdrop-blur-sm flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>

            {/* Advertise */}
            <Separator className="my-4 opacity-50" />
            <button
              onClick={() => { setOpen(false); navigate('/advertise'); }}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-primary/8 to-accent/8 hover:from-primary/12 hover:to-accent/12 backdrop-blur-sm transition-all active:scale-[0.98] border border-primary/10"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/12 backdrop-blur-sm flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium text-sm">Faire de la publicité</span>
                <p className="text-[11px] text-muted-foreground">Promouvoir votre activité</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>

            {/* Admin / Moderator */}
            {(isAdmin || isModerator) && onNavigateToAdmin && (
              <>
                <Separator className="my-4 opacity-50" />
                <button
                  onClick={() => { setOpen(false); onNavigateToAdmin(); }}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl backdrop-blur-sm transition-all active:scale-[0.98] border ${
                    isAdmin 
                      ? 'bg-amber-500/8 hover:bg-amber-500/15 border-amber-500/15' 
                      : 'bg-blue-500/8 hover:bg-blue-500/15 border-blue-500/15'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isAdmin ? 'bg-amber-500/15' : 'bg-blue-500/15'
                  }`}>
                    <Shield className={`w-5 h-5 ${isAdmin ? 'text-amber-500' : 'text-blue-500'}`} />
                  </div>
                  <span className={`flex-1 text-left font-semibold text-sm ${
                    isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isAdmin ? 'Administration' : 'Modération'}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isAdmin ? 'text-amber-500/50' : 'text-blue-500/50'}`} />
                </button>
              </>
            )}

            {/* Data Management */}
            <Separator className="my-4 opacity-50" />
            <div className="mb-2 px-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Mes données (RGPD)
              </h3>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => { setOpen(false); setShowDataExport(true); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 backdrop-blur-sm transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/12 flex items-center justify-center">
                  <Download className="w-4 h-4 text-blue-500" />
                </div>
                <span className="flex-1 text-left font-medium text-sm">Télécharger mes données</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
              <button
                onClick={() => { setOpen(false); setShowDeleteAccount(true); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 backdrop-blur-sm transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-destructive/12 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </div>
                <span className="flex-1 text-left font-medium text-sm text-destructive">Supprimer mon compte</span>
                <ChevronRight className="w-4 h-4 text-destructive/40" />
              </button>
            </div>

            <Separator className="my-4 opacity-50" />

            {/* Sign out */}
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-destructive/8 hover:bg-destructive/15 backdrop-blur-sm transition-all active:scale-[0.98] border border-destructive/10"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <span className="flex-1 text-left font-semibold text-sm text-destructive">Se déconnecter</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ProfileSettingsDrawer;
