import { motion } from 'framer-motion';
import { CalendarClock, MailCheck, MailX, Loader2 } from 'lucide-react';
import { useWeeklyDigestStatus } from '@/hooks/useWeeklyDigestStatus';
import { cn } from '@/lib/utils';

const formatDateFr = (iso: string | Date | null): string => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelative = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'il y a 1 semaine';
  return `il y a ${weeks} semaines`;
};

interface WeeklyDigestStatusProps {
  enabled: boolean;
  isPreferenceLoading: boolean;
}

export const WeeklyDigestStatus = ({ enabled, isPreferenceLoading }: WeeklyDigestStatusProps) => {
  const { lastSentAt, nextScheduledAt, isLoading } = useWeeklyDigestStatus();

  if (isPreferenceLoading || isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement du statut…</span>
      </div>
    );
  }

  if (!enabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-4 flex items-start gap-3"
      >
        <div className="rounded-lg bg-muted/60 p-2 shrink-0">
          <MailX className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Récapitulatif désactivé</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Active l'option ci-dessus pour recevoir chaque lundi un résumé personnalisé de ton activité et de la communauté.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-gradient-to-br from-secondary/40 to-secondary/10 p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-lg p-2 shrink-0",
          lastSentAt ? "bg-emerald-500/10" : "bg-muted/60"
        )}>
          <MailCheck className={cn("h-4 w-4", lastSentAt ? "text-emerald-500" : "text-muted-foreground")} />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium">Dernier récapitulatif envoyé</p>
          {lastSentAt ? (
            <>
              <p className="text-xs text-muted-foreground capitalize">{formatDateFr(lastSentAt)}</p>
              <p className="text-[11px] text-muted-foreground/80">{formatRelative(lastSentAt)}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aucun e-mail envoyé pour le moment — le premier arrive lundi prochain.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 pt-2 border-t border-border/40">
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <CalendarClock className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium">Prochain envoi prévu</p>
          <p className="text-xs text-muted-foreground capitalize">{formatDateFr(nextScheduledAt)}</p>
          <p className="text-[11px] text-muted-foreground/80">Heure de Paris (~9h00)</p>
        </div>
      </div>
    </motion.div>
  );
};
