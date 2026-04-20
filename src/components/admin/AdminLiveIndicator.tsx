/**
 * AdminLiveIndicator — petit badge "Live" qui scintille à chaque event realtime.
 * Branche-le sur un Zustand selector ou un compteur d'events qui s'incrémente.
 *
 * Usage simple :
 *   <AdminLiveIndicator />     // se synchronise tout seul sur l'events bus
 */
import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  className?: string;
}

const AdminLiveIndicator = ({ className }: Props) => {
  const [pulse, setPulse] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('admin-live-indicator')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        setPulse(true);
        setCount((c) => c + 1);
        setTimeout(() => setPulse(false), 800);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moderation_tasks' }, () => {
        setPulse(true);
        setCount((c) => c + 1);
        setTimeout(() => setPulse(false), 800);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        setPulse(true);
        setCount((c) => c + 1);
        setTimeout(() => setPulse(false), 800);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 transition-all',
        pulse && 'border-emerald-500/60 bg-emerald-500/20 scale-105',
        className,
      )}
      title={`Connexion temps réel active${count ? ` — ${count} évènements reçus` : ''}`}
      aria-live="polite"
    >
      <span className="relative flex w-2 h-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75',
            pulse ? 'animate-ping' : '',
          )}
        />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
        Live
      </span>
    </div>
  );
};

export default AdminLiveIndicator;
