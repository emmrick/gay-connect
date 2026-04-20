import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Eye, CheckCircle, XCircle, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ReportWithProfiles, ReportStatus } from '@/hooks/useAdmin';
import { reportReasonLabels } from '@/hooks/useReports';
import { AdminCard } from './ui/AdminCard';

const statusConfig: Record<
  ReportStatus,
  { label: string; icon: React.ElementType; iconClass: string; ringClass: string; dotClass: string }
> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    iconClass: 'text-orange-500',
    ringClass: 'bg-orange-500/10 ring-1 ring-orange-500/20',
    dotClass: 'bg-orange-500',
  },
  reviewed: {
    label: 'En cours',
    icon: Eye,
    iconClass: 'text-blue-500',
    ringClass: 'bg-blue-500/10 ring-1 ring-blue-500/20',
    dotClass: 'bg-blue-500',
  },
  resolved: {
    label: 'Résolu',
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
    ringClass: 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  dismissed: {
    label: 'Rejeté',
    icon: XCircle,
    iconClass: 'text-muted-foreground',
    ringClass: 'bg-muted ring-1 ring-border/40',
    dotClass: 'bg-muted-foreground/40',
  },
};

const typeIcons: Record<string, React.ElementType> = {
  user: Users,
  message: MessageSquare,
  group: Users,
};

interface Props {
  report: ReportWithProfiles;
  onClick: () => void;
}

const ReportCard = ({ report, onClick }: Props) => {
  const status = statusConfig[report.status];
  const StatusIcon = status.icon;
  const TypeIcon = typeIcons[report.report_type] || Users;

  const reasonLabel =
    reportReasonLabels[report.reason as keyof typeof reportReasonLabels] || report.reason;

  return (
    <AdminCard interactive onClick={onClick} padding="md" className="group">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            status.ringClass,
          )}
        >
          <StatusIcon className={cn('w-4.5 h-4.5', status.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dotClass)} />
            <span className="text-sm font-display font-semibold truncate">
              {report.reported_user?.username || 'Utilisateur inconnu'}
            </span>
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-medium gap-1 bg-muted/60"
            >
              <TypeIcon className="w-3 h-3" />
              {report.report_type === 'message'
                ? 'Message'
                : report.report_type === 'group'
                  ? 'Groupe'
                  : 'Profil'}
            </Badge>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-medium border-border/60"
            >
              {reasonLabel}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            Signalé par{' '}
            <span className="font-medium text-foreground/70">
              {report.reporter?.username || 'Anonyme'}
            </span>
          </p>

          {report.report_type === 'message' && report.message?.content && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
              « {report.message.content} »
            </p>
          )}
          {report.description && report.report_type !== 'message' && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {report.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground/80 whitespace-nowrap tabular-nums">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: fr })}
          </span>
          <Badge
            variant="outline"
            className={cn(
              'h-5 px-1.5 text-[10px] font-semibold border-current/30',
              status.iconClass,
            )}
          >
            {status.label}
          </Badge>
        </div>
      </div>
    </AdminCard>
  );
};

export default ReportCard;
