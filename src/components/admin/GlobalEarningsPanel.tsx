/**
 * GlobalEarningsPanel — refonte design system.
 * KPIs financiers + classement des modérateurs + répartition par tâche.
 * Logique métier conservée (mêmes queries Supabase).
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp, Users, Euro, Calendar, Loader2, BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  formatCents,
  getTaskLabel,
  ModeratorTaskType,
} from '@/hooks/useModeratorEarnings';
import { cn } from '@/lib/utils';
import {
  AdminCard,
  AdminSectionHeader,
  StatTile,
  EmptyState,
  AdminFilterBar,
  AdminFilterChip,
} from './ui';

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

interface ModeratorStats {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_earned: number;
  task_count: number;
  by_type: Record<string, { count: number; total: number }>;
}

const TaskIcon = ({ type }: { type: ModeratorTaskType }) => {
  switch (type) {
    case 'identity_verification':
      return <span className="text-blue-500">🪪</span>;
    case 'report_response':
      return <span className="text-orange-500">🚨</span>;
    case 'user_suspension':
      return <span className="text-red-500">🔒</span>;
    case 'private_message_response':
      return <span className="text-emerald-500">💬</span>;
    default:
      return <span>📋</span>;
  }
};

const useGlobalEarnings = (period: PeriodFilter) => {
  return useQuery({
    queryKey: ['global-earnings', period],
    queryFn: async () => {
      let startDate: Date | null = null;
      const now = new Date();

      switch (period) {
        case 'today': startDate = startOfDay(now); break;
        case 'week': startDate = startOfWeek(now, { locale: fr }); break;
        case 'month': startDate = startOfMonth(now); break;
        case 'all':
        default: startDate = null;
      }

      let query = supabase
        .from('moderator_earnings')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: earnings, error } = await query;
      if (error) throw error;

      const userIds = [...new Set(earnings?.map((e) => e.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const moderatorStats: Map<string, ModeratorStats> = new Map();

      (earnings || []).forEach((earning) => {
        const profile = profileMap.get(earning.user_id);

        if (!moderatorStats.has(earning.user_id)) {
          moderatorStats.set(earning.user_id, {
            user_id: earning.user_id,
            username: profile?.username || 'Utilisateur inconnu',
            avatar_url: profile?.avatar_url || null,
            total_earned: 0,
            task_count: 0,
            by_type: {},
          });
        }

        const stats = moderatorStats.get(earning.user_id)!;
        stats.total_earned += earning.amount_cents;
        stats.task_count += 1;

        const taskType = earning.task_type as string;
        if (!stats.by_type[taskType]) {
          stats.by_type[taskType] = { count: 0, total: 0 };
        }
        stats.by_type[taskType].count += 1;
        stats.by_type[taskType].total += earning.amount_cents;
      });

      const globalStats = {
        totalEarned: (earnings || []).reduce((sum, e) => sum + e.amount_cents, 0),
        totalTasks: earnings?.length || 0,
        moderatorCount: moderatorStats.size,
        byType: {} as Record<string, { count: number; total: number }>,
      };

      (earnings || []).forEach((e) => {
        const type = e.task_type as string;
        if (!globalStats.byType[type]) {
          globalStats.byType[type] = { count: 0, total: 0 };
        }
        globalStats.byType[type].count += 1;
        globalStats.byType[type].total += e.amount_cents;
      });

      const sortedModerators = Array.from(moderatorStats.values()).sort(
        (a, b) => b.total_earned - a.total_earned,
      );

      return {
        globalStats,
        moderators: sortedModerators,
        earnings: earnings || [],
      };
    },
  });
};

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout le temps' },
];

const GlobalEarningsPanel = () => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const { data, isLoading } = useGlobalEarnings(period);

  const periodLabel = useMemo(
    () => PERIODS.find((p) => p.value === period)?.label ?? '',
    [period],
  );

  const maxEarned = useMemo(() => {
    if (!data?.moderators.length) return 0;
    return Math.max(...data.moderators.map((m) => m.total_earned));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  const avgPerModerator = data?.globalStats.moderatorCount
    ? Math.round(data.globalStats.totalEarned / data.globalStats.moderatorCount)
    : 0;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        icon={BarChart3}
        eyebrow="Finances modération"
        title="Gains globaux des modérateurs"
      />

      {/* Period filter */}
      <AdminFilterBar
        filters={
          <>
            {PERIODS.map((p) => (
              <AdminFilterChip
                key={p.value}
                active={period === p.value}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </AdminFilterChip>
            ))}
          </>
        }
      />

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          label={`Total gagné · ${periodLabel}`}
          value={formatCents(data?.globalStats.totalEarned || 0)}
          icon={Euro}
          accent="emerald"
        />
        <StatTile
          label="Tâches réalisées"
          value={data?.globalStats.totalTasks || 0}
          icon={TrendingUp}
          accent="blue"
        />
        <StatTile
          label="Modérateurs actifs"
          value={data?.globalStats.moderatorCount || 0}
          icon={Users}
          accent="violet"
        />
        <StatTile
          label="Moy. / modérateur"
          value={formatCents(avgPerModerator)}
          icon={Calendar}
          accent="orange"
        />
      </div>

      {/* Task type breakdown */}
      <AdminCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-display font-semibold">Répartition par type de tâche</p>
        </div>
        {Object.keys(data?.globalStats.byType || {}).length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Aucune tâche pour cette période"
            description="Les gains apparaîtront dès qu'une mission sera validée."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data?.globalStats.byType || {}).map(([type, stats]) => (
              <div
                key={type}
                className="p-3 rounded-xl border border-border/40 bg-muted/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TaskIcon type={type as ModeratorTaskType} />
                  <span className="text-xs truncate text-foreground/90">
                    {getTaskLabel(type as ModeratorTaskType)}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary tabular-nums">
                  {formatCents(stats.total)}
                </p>
                <p className="text-[10px] text-muted-foreground">{stats.count} tâches</p>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Leaderboard */}
      <AdminCard padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-display font-semibold">Classement des modérateurs</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {data?.moderators.length || 0} actif·ves
          </Badge>
        </div>

        <ScrollArea className="h-[420px]">
          {data?.moderators.length ? (
            <div className="space-y-2 pr-2">
              {data.moderators.map((mod, index) => (
                <ModeratorRow
                  key={mod.user_id}
                  mod={mod}
                  index={index}
                  maxEarned={maxEarned}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Aucune donnée pour cette période"
              description="Aucun modérateur n'a perçu de rémunération sur la période sélectionnée."
            />
          )}
        </ScrollArea>
      </AdminCard>
    </div>
  );
};

const RANK_STYLES: Record<number, string> = {
  0: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950',
  1: 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800',
  2: 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50',
};

const ModeratorRow = ({
  mod, index, maxEarned,
}: {
  mod: ModeratorStats;
  index: number;
  maxEarned: number;
}) => (
  <div className="p-3 rounded-2xl border border-border/40 bg-card hover:border-border/70 hover:bg-muted/30 transition-colors">
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0',
          RANK_STYLES[index] ?? 'bg-muted text-muted-foreground',
        )}
      >
        {index + 1}
      </div>

      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarImage src={mod.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/15 text-primary text-xs">
          {mod.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{mod.username}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {mod.task_count} tâches
          </Badge>
        </div>
        <Progress
          value={maxEarned > 0 ? (mod.total_earned / maxEarned) * 100 : 0}
          className="h-1.5 mt-1.5"
        />
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          {Object.entries(mod.by_type).map(([type, stats]) => (
            <span key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TaskIcon type={type as ModeratorTaskType} />
              <span className="tabular-nums">{stats.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-base font-display font-bold text-primary tabular-nums">
          {formatCents(mod.total_earned)}
        </p>
      </div>
    </div>
  </div>
);

export default GlobalEarningsPanel;
