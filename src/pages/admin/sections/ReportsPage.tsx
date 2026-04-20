import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Inbox, RefreshCcw, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ReportCard from '@/components/admin/ReportCard';
import {
  AdminSectionHeader,
  AdminFilterBar,
  AdminTabsBar,
  AdminListSkeleton,
  EmptyState,
  type AdminTab,
} from '@/components/admin/ui';
import { useAdminReports, useReportStats, ReportStatus } from '@/hooks/useAdmin';
import { useActiveTask } from '@/hooks/useModerationTaskQueue';
import type { AdminOutletContext } from '../AdminLayout';

type TabValue = ReportStatus | 'all';

const ReportsPage = () => {
  const { setSelectedReport } = useOutletContext<AdminOutletContext>();
  const [tab, setTab] = useState<TabValue>('pending');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: reports, isLoading, isFetching } = useAdminReports(
    tab === 'all' ? undefined : tab,
  );
  const { data: stats } = useReportStats();
  const { data: activeTask } = useActiveTask();
  const autoOpened = useRef<string | null>(null);

  // Auto-ouverture mission contextuelle
  useEffect(() => {
    if (
      activeTask?.task_type === 'report_review' &&
      activeTask.target_entity_id &&
      reports?.length &&
      autoOpened.current !== activeTask.target_entity_id
    ) {
      const match = reports.find((r) => r.id === activeTask.target_entity_id);
      if (match) {
        setSelectedReport(match);
        autoOpened.current = activeTask.target_entity_id;
      } else if (tab !== 'all') {
        setTab('all');
      }
    }
  }, [activeTask, reports, tab, setSelectedReport]);

  // Filtrage côté client (recherche)
  const filtered = useMemo(() => {
    if (!reports) return [];
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) => {
      return (
        r.reported_user?.username?.toLowerCase().includes(q) ||
        r.reporter?.username?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.message?.content?.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  const tabs: AdminTab<TabValue>[] = [
    { value: 'pending', label: 'En attente', count: stats?.pending, tone: 'warning' },
    { value: 'reviewed', label: 'En cours', count: stats?.reviewed, tone: 'info' },
    { value: 'resolved', label: 'Résolus', count: stats?.resolved, tone: 'success' },
    { value: 'dismissed', label: 'Rejetés', tone: 'default' },
    { value: 'all', label: 'Tous', tone: 'default' },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['report-stats'] });
  };

  return (
    <div className="space-y-3">
      <AdminSectionHeader
        icon={AlertTriangle}
        eyebrow="Modération"
        title="Signalements"
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 gap-1.5 text-xs"
            disabled={isFetching}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        }
      />

      <AdminTabsBar<TabValue> tabs={tabs} value={tab} onChange={setTab} />

      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par membre, motif, contenu…"
      />

      <div className="min-h-[200px]">
        {isLoading ? (
          <AdminListSkeleton count={5} />
        ) : filtered.length === 0 ? (
          search ? (
            <EmptyState
              icon={Search}
              title="Aucun résultat"
              description={`Aucun signalement ne correspond à « ${search} ».`}
              action={
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Effacer la recherche
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="Tout est en ordre 👌"
              description={
                tab === 'pending'
                  ? 'Aucun signalement en attente de traitement.'
                  : 'Aucun signalement dans cette catégorie.'
              }
            />
          )
        ) : (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => setSelectedReport(report)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
