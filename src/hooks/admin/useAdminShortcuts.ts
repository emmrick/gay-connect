/**
 * useAdminShortcuts — raccourcis clavier globaux pour /admin.
 * Séquences "g + X" (style Vim/Linear/GitHub) :
 *   g d  → dashboard
 *   g m  → missions (pending-tasks)
 *   g r  → signalements
 *   g u  → utilisateurs
 *   g s  → support
 *   g v  → vérification
 *   ?    → aide raccourcis (callback)
 *
 * Ignore les raccourcis si la cible est un input / textarea / contenteditable.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildAdminPath } from '@/config/adminRoutes';
import type { AdminSection } from '@/components/admin/AdminSidebar';

const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
};

const sequenceMap: Record<string, AdminSection> = {
  d: 'dashboard',
  m: 'pending-tasks',
  r: 'reports',
  u: 'users',
  s: 'support',
  v: 'verification',
  c: 'moderation',
  i: 'ai-moderation',
  w: 'wallet',
  p: 'credit-purchases',
  e: 'moderators',
  t: 'rates',
  f: 'feature-toggles',
  l: 'error-logs',
};

export interface AdminShortcut {
  combo: string;
  description: string;
  group: string;
}

export const ADMIN_SHORTCUTS: AdminShortcut[] = [
  { combo: '⌘ K', description: 'Recherche rapide', group: 'Général' },
  { combo: '?', description: 'Afficher les raccourcis', group: 'Général' },
  { combo: 'g d', description: 'Tableau de bord', group: 'Navigation' },
  { combo: 'g m', description: 'Missions', group: 'Navigation' },
  { combo: 'g r', description: 'Signalements', group: 'Navigation' },
  { combo: 'g u', description: 'Membres', group: 'Navigation' },
  { combo: 'g s', description: 'Support client', group: 'Navigation' },
  { combo: 'g v', description: 'Vérification identité', group: 'Modération' },
  { combo: 'g c', description: 'Modération de contenu', group: 'Modération' },
  { combo: 'g i', description: 'Modération IA', group: 'Modération' },
  { combo: 'g e', description: 'Équipe (modérateurs)', group: 'Équipe' },
  { combo: 'g w', description: 'Portefeuille', group: 'Finances' },
  { combo: 'g p', description: 'Achats de crédits', group: 'Finances' },
  { combo: 'g t', description: 'Tarifs missions', group: 'Finances' },
  { combo: 'g f', description: 'Feature toggles', group: 'Configuration' },
  { combo: 'g l', description: 'Journal d\'erreurs', group: 'Logs' },
];

interface Options {
  enabled?: boolean;
  onHelpRequested?: () => void;
}

export const useAdminShortcuts = ({ enabled = true, onHelpRequested }: Options = {}) => {
  const navigate = useNavigate();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      // ? → aide
      if (e.key === '?' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        onHelpRequested?.();
        return;
      }

      // g → entrer en mode séquence (1.5 s)
      if (e.key === 'g' && pendingG.current === null) {
        pendingG.current = window.setTimeout(() => {
          pendingG.current = null;
        }, 1500);
        return;
      }

      // Lettre suivante après g
      if (pendingG.current !== null) {
        clearTimeout(pendingG.current);
        pendingG.current = null;
        const key = e.key.toLowerCase();
        const target = sequenceMap[key];
        if (target) {
          e.preventDefault();
          navigate(buildAdminPath(target), { replace: true });
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (pendingG.current !== null) {
        clearTimeout(pendingG.current);
        pendingG.current = null;
      }
    };
  }, [enabled, navigate, onHelpRequested]);
};
