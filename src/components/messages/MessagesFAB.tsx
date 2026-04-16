/**
 * Radial FAB for the Messages page — exposes 3 actions with a single button:
 *  - New private message (opens member search)
 *  - Create custom group
 *  - Join regional group
 *
 * Replaces the duplicated "+" buttons that were in the header before.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquarePlus, Users, Globe2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessagesFABProps {
  onNewChat: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

interface ActionConfig {
  key: string;
  label: string;
  icon: typeof Plus;
  bg: string;
  onClick: () => void;
}

const MessagesFAB = ({ onNewChat, onCreateGroup, onJoinGroup }: MessagesFABProps) => {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const actions: ActionConfig[] = [
    {
      key: 'chat',
      label: 'Nouveau message',
      icon: MessageSquarePlus,
      bg: 'bg-primary text-primary-foreground',
      onClick: () => { onNewChat(); setOpen(false); },
    },
    {
      key: 'create',
      label: 'Créer un groupe',
      icon: Users,
      bg: 'bg-accent text-accent-foreground',
      onClick: () => { onCreateGroup(); setOpen(false); },
    },
    {
      key: 'join',
      label: 'Rejoindre un groupe',
      icon: Globe2,
      bg: 'bg-secondary text-secondary-foreground border border-border',
      onClick: () => { onJoinGroup(); setOpen(false); },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* FAB column */}
      <div
        className="fixed right-4 z-50 flex flex-col items-end gap-3"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <AnimatePresence>
          {open &&
            actions.map((action, index) => (
              <motion.button
                key={action.key}
                onClick={action.onClick}
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.85 }}
                transition={{ duration: 0.18, delay: index * 0.04 }}
                className="flex items-center gap-3"
              >
                <span className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur border border-border text-sm font-medium text-foreground shadow-md">
                  {action.label}
                </span>
                <span
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center shadow-lg',
                    action.bg
                  )}
                >
                  <action.icon className="w-5 h-5" />
                </span>
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main toggle */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fermer les actions' : 'Ouvrir les actions'}
          aria-expanded={open}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center transition-transform',
            open && 'rotate-45'
          )}
          style={{ transition: 'transform 0.2s' }}
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
};

export default MessagesFAB;
