/**
 * Refactored Missions panel — modular, store-driven, realtime.
 * Replaces the legacy PendingTasksPanel for the new admin section,
 * but the old panel still exists so we don't break Admin.tsx routing.
 */
import { useEffect, useMemo } from 'react';
import { ListOrdered, Lock, Clock, RefreshCw } from 'lucide-react';
import { useTasksStore } from '@/stores/admin/useTasksStore';
import { useRecycleTask } from '@/hooks/useModerationTaskQueue';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionHeader, EmptyState, LoadingList, ErrorState } from '../_shared/AdminAtoms';
import MissionCard from './MissionCard';

const MissionsPanel = () => {
  const { missions, missionsState, missionsError, fetchMissions } = useTasksStore();
  const recycleTask = useRecycleTask();

  useEffect(() => {
    fetchMissions('pending');
  }, [fetchMissions]);

  const { reserved, pending } = useMemo(() => {
    return {
      reserved: missions.filter((m) => m.status === 'reserved'),
      pending: missions.filter((m) => m.status === 'pending'),
    };
  }, [missions]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={ListOrdered}
        title="File d'attente des missions"
        subtitle={
          missionsState === 'loading'
            ? 'Chargement...'
            : `${pending.length} en attente · ${reserved.length} réservée(s)`
        }
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMissions('pending', { force: true })}
            disabled={missionsState === 'loading'}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Rafraîchir
          </Button>
        }
      />

      {missionsState === 'loading' && missions.length === 0 && <LoadingList rows={4} />}

      {missionsState === 'error' && (
        <ErrorState
          message={missionsError ?? undefined}
          onRetry={() => fetchMissions('pending', { force: true })}
        />
      )}

      {missionsState !== 'loading' && missions.length === 0 && (
        <EmptyState
          icon={ListOrdered}
          title="Aucune mission en attente"
          description="Les nouvelles missions apparaîtront ici automatiquement"
        />
      )}

      {reserved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Réservées
          </p>
          <div className="space-y-2">
            {reserved.map((task) => (
              <MissionCard
                key={task.id}
                task={task}
                onRecycle={(id) => recycleTask.mutate(id)}
                recycling={recycleTask.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            En attente ({pending.length})
          </p>
          <ScrollArea className="max-h-[60vh] pr-1 sm:max-h-[calc(100vh-380px)]">
            <div className="space-y-2">
              {pending.map((task, idx) => (
                <MissionCard
                  key={task.id}
                  task={task}
                  index={idx}
                  onRecycle={(id) => recycleTask.mutate(id)}
                  recycling={recycleTask.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default MissionsPanel;
