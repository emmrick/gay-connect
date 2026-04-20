/**
 * AdminShortcutsDialog — modale d'aide listant tous les raccourcis clavier.
 * Déclenchée par la touche `?`.
 */
import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ADMIN_SHORTCUTS } from '@/hooks/admin/useAdminShortcuts';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const AdminShortcutsDialog = ({ open, onOpenChange }: Props) => {
  const grouped = ADMIN_SHORTCUTS.reduce(
    (acc, s) => {
      (acc[s.group] ??= []).push(s);
      return acc;
    },
    {} as Record<string, typeof ADMIN_SHORTCUTS>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base font-display">
            <Keyboard className="w-4 h-4 text-primary" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription className="text-xs">
            Naviguez plus vite — appuyez sur <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">?</kbd> à
            tout moment pour réafficher cette liste.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                {group}
              </h3>
              <ul className="space-y-1.5">
                {items.map((s) => (
                  <li
                    key={s.combo}
                    className="flex items-center justify-between gap-3 text-sm py-1"
                  >
                    <span className="text-foreground/80">{s.description}</span>
                    <Kbd combo={s.combo} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Kbd = ({ combo }: { combo: string }) => (
  <span className="flex items-center gap-1">
    {combo.split(' ').map((part, i) => (
      <kbd
        key={i}
        className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[10px] font-mono font-semibold bg-muted border border-border/60 text-foreground/80 shadow-[inset_0_-1px_0_hsl(var(--border)/0.5)]"
      >
        {part}
      </kbd>
    ))}
  </span>
);

export default AdminShortcutsDialog;
