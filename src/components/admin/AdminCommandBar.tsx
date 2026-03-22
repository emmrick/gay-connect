import { useState, useEffect, useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AdminSection } from './AdminSidebar';

interface CommandItem {
  id: AdminSection;
  label: string;
  group: string;
  keywords: string[];
}

const commandItems: CommandItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', group: 'Navigation', keywords: ['accueil', 'home', 'stats'] },
  { id: 'pending-tasks', label: 'Missions', group: 'Tâches', keywords: ['missions', 'tâches', 'queue'] },
  { id: 'support', label: 'Support client', group: 'Tâches', keywords: ['support', 'tickets', 'aide'] },
  { id: 'support-ratings', label: 'Avis support', group: 'Tâches', keywords: ['avis', 'ratings', 'évaluation'] },
  { id: 'verification', label: 'Vérification identité', group: 'Modération', keywords: ['identité', 'id', 'vérif'] },
  { id: 'reports', label: 'Signalements', group: 'Modération', keywords: ['signalement', 'report', 'plainte'] },
  { id: 'moderation', label: 'Modération contenu', group: 'Modération', keywords: ['contenu', 'photos', 'profils'] },
  { id: 'ai-moderation', label: 'Modération IA', group: 'Modération', keywords: ['ia', 'ai', 'automatique'] },
  { id: 'screenshot-sanctions', label: 'Captures écran', group: 'Modération', keywords: ['capture', 'screenshot'] },
  { id: 'users', label: 'Utilisateurs', group: 'Utilisateurs', keywords: ['utilisateur', 'membre', 'profil'] },
  { id: 'stats', label: 'Statistiques', group: 'Utilisateurs', keywords: ['stats', 'analytics'] },
  { id: 'moderators', label: 'Modérateurs', group: 'Utilisateurs', keywords: ['modérateur', 'équipe'] },
  { id: 'wallet', label: 'Portefeuille', group: 'Finances', keywords: ['wallet', 'portefeuille', 'solde'] },
  { id: 'credits-surveillance', label: 'Surveillance crédits', group: 'Finances', keywords: ['surveillance', 'fraude'] },
  { id: 'credit-purchases', label: 'Achats crédits', group: 'Finances', keywords: ['achat', 'purchase'] },
  { id: 'rates', label: 'Tarifs missions', group: 'Finances', keywords: ['tarif', 'rate', 'prix'] },
  { id: 'withdrawals', label: 'Retraits', group: 'Finances', keywords: ['retrait', 'withdrawal'] },
  { id: 'global', label: 'Gains globaux', group: 'Finances', keywords: ['gains', 'revenus'] },
  { id: 'broadcast', label: 'Notifications', group: 'Communication', keywords: ['notification', 'push', 'broadcast'] },
  { id: 'popups', label: 'Pop-ups', group: 'Communication', keywords: ['popup', 'bannière'] },
  { id: 'faq', label: 'Centre d\'aide', group: 'Communication', keywords: ['faq', 'aide', 'help'] },
  { id: 'flyers', label: 'Flyers', group: 'Communication', keywords: ['flyer', 'affiche'] },
  { id: 'promo', label: 'Codes promo', group: 'Communication', keywords: ['promo', 'code', 'réduction'] },
  { id: 'ads', label: 'Annonces pub', group: 'Communication', keywords: ['annonce', 'pub', 'publicité'] },
  { id: 'credit-costs', label: 'Tarifs crédits', group: 'Configuration', keywords: ['tarif', 'coût', 'crédit'] },
  { id: 'maintenance', label: 'Maintenance', group: 'Configuration', keywords: ['maintenance', 'hors ligne'] },
  { id: 'error-logs', label: 'Logs erreurs', group: 'Monitoring', keywords: ['erreur', 'log', 'bug'] },
  { id: 'security', label: 'Sécurité', group: 'Monitoring', keywords: ['sécurité', 'security', 'alerte'] },
];

interface AdminCommandBarProps {
  onNavigate: (section: AdminSection) => void;
  className?: string;
}

const AdminCommandBar = ({ onNavigate, className }: AdminCommandBarProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredItems = search.trim()
    ? commandItems.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some(k => k.includes(search.toLowerCase()))
      )
    : commandItems;

  const groupedResults = filteredItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleSelect = useCallback((id: AdminSection) => {
    onNavigate(id);
    setOpen(false);
    setSearch('');
  }, [onNavigate]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 h-9 rounded-lg border border-border/60 bg-muted/40",
          "text-sm text-muted-foreground hover:bg-muted/60 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 ml-auto text-[10px] text-muted-foreground/60 bg-background/80 px-1.5 py-0.5 rounded border border-border/40">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Recherche rapide</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une section..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto py-2">
            {Object.entries(groupedResults).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun résultat trouvé
              </div>
            ) : (
              Object.entries(groupedResults).map(([group, items]) => (
                <div key={group}>
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group}
                    </span>
                  </div>
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCommandBar;
