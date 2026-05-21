import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Activity, AlertTriangle, Clock, Gauge, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type Window = '60' | '360' | '1440';

const WINDOWS: { value: Window; label: string }[] = [
  { value: '60', label: '1 h' },
  { value: '360', label: '6 h' },
  { value: '1440', label: '24 h' },
];

type PerfRow = {
  page: string;
  metric: string;
  samples: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  max_ms: number;
};

type ErrorSummary = { total: number; by_source: Record<string, number> };

const METRIC_LABELS: Record<string, string> = {
  time_to_first_profile: 'Page Accueil — 1er profil affiché',
  nearby_base_query: 'Requête profils (base)',
  nearby_geo_rpc: 'Requête profils géolocalisés (RPC)',
};

const colorFor = (p95: number, metric: string): string => {
  // Seuils heuristiques (en ms)
  const thresholds: Record<string, [number, number]> = {
    time_to_first_profile: [1500, 3000],
    nearby_base_query: [500, 1500],
    nearby_geo_rpc: [800, 2000],
  };
  const [warn, bad] = thresholds[metric] ?? [1000, 3000];
  if (p95 >= bad) return 'text-destructive font-bold';
  if (p95 >= warn) return 'text-amber-500 font-semibold';
  return 'text-emerald-500 font-semibold';
};

const fmtMs = (n: number | null | undefined) =>
  n == null ? '—' : `${Math.round(Number(n))} ms`;

const PerformancePage = () => {
  const [windowMin, setWindowMin] = useState<Window>('1440');

  const { data: summary, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['perf-summary', windowMin],
    queryFn: async (): Promise<PerfRow[]> => {
      const { data, error } = await supabase.rpc('get_perf_summary' as any, {
        _page: null,
        _since_minutes: Number(windowMin),
      });
      if (error) throw error;
      return (data ?? []) as PerfRow[];
    },
    staleTime: 30_000,
  });

  const { data: errSummary } = useQuery({
    queryKey: ['error-summary', windowMin],
    queryFn: async (): Promise<ErrorSummary> => {
      const { data, error } = await supabase.rpc('get_error_summary' as any, {
        _since_minutes: Number(windowMin),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        total: Number(row?.total ?? 0),
        by_source: (row?.by_source ?? {}) as Record<string, number>,
      };
    },
    staleTime: 30_000,
  });

  const totalSamples = (summary ?? []).reduce((s, r) => s + Number(r.samples), 0);
  const worstP95 = (summary ?? []).reduce<PerfRow | null>(
    (acc, r) => (acc && acc.p95_ms > r.p95_ms ? acc : r),
    null,
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6 text-primary" />
            Performance — Accueil
          </h1>
          <p className="text-sm text-muted-foreground">
            Temps de chargement, latence des requêtes et erreurs récentes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={windowMin} onValueChange={(v) => setWindowMin(v as Window)}>
            <TabsList>
              {WINDOWS.map((w) => (
                <TabsTrigger key={w.value} value={w.value}>{w.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            <Activity className="w-3.5 h-3.5" /> Mesures collectées
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totalSamples}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            <Zap className="w-3.5 h-3.5" /> Pire p95
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">
            {worstP95 ? fmtMs(worstP95.p95_ms) : '—'}
          </div>
          {worstP95 && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {METRIC_LABELS[worstP95.metric] ?? worstP95.metric}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" /> Erreurs ({WINDOWS.find(w => w.value === windowMin)?.label})
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{errSummary?.total ?? 0}</div>
          {errSummary?.by_source && Object.keys(errSummary.by_source).length > 0 && (
            <div className="text-[11px] text-muted-foreground mt-1 space-x-2">
              {Object.entries(errSummary.by_source).slice(0, 4).map(([k, v]) => (
                <span key={k}>{k}: <b className="text-foreground">{v}</b></span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="font-bold">Latences par métrique</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (summary?.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucune mesure collectée sur cette période. Patiente que des utilisateurs visitent la page.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrique</TableHead>
                <TableHead className="text-right">Échantillons</TableHead>
                <TableHead className="text-right">Moyenne</TableHead>
                <TableHead className="text-right">p50</TableHead>
                <TableHead className="text-right">p95</TableHead>
                <TableHead className="text-right">p99</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary!.map((r) => (
                <TableRow key={`${r.page}:${r.metric}`}>
                  <TableCell>
                    <div className="font-semibold">{METRIC_LABELS[r.metric] ?? r.metric}</div>
                    <div className="text-[11px] text-muted-foreground">{r.page}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.samples}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMs(r.avg_ms)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMs(r.p50_ms)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${colorFor(Number(r.p95_ms), r.metric)}`}>
                    {fmtMs(r.p95_ms)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMs(r.p99_ms)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMs(r.max_ms)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Mesures échantillonnées à 25 % côté client et flushées toutes les 5 s. Les seuils de couleur sur le p95
        servent à repérer rapidement un goulot d'étranglement quand le trafic augmente.
      </p>
    </div>
  );
};

export default PerformancePage;
