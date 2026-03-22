import { useQuery } from '@tanstack/react-query';
import { startOfDay, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Activity, Shield, MessageSquare, UserPlus, Crown,
  AlertTriangle, IdCard, ShoppingCart, Headphones, ListOrdered,
  TrendingUp, Eye, Globe, ArrowRight, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AdminSection } from './AdminSidebar';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  onNavigate: (section: AdminSection) => void;
  pendingReports: number;
  pendingVerifications: number;
  pendingPurchases: number;
  isAdmin: boolean;
}

const useQuickStats = () => {
  return useQuery({
    queryKey: ['admin-quick-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const weekAgo = subDays(today, 7).toISOString();

      const [
        { count: totalUsers },
        { count: onlineUsers },
        { count: verifiedUsers },
        { count: premiumUsers },
        { count: newUsersToday },
        { count: newUsersWeek },
        { count: totalMessages },
        { count: messagesWeek },
        { count: pendingTasks },
        { count: openTickets },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('moderation_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);

      return {
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        premiumUsers: premiumUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        totalMessages: totalMessages || 0,
        messagesWeek: messagesWeek || 0,
        pendingTasks: pendingTasks || 0,
        openTickets: openTickets || 0,
      };
    },
    refetchInterval: 30000,
  });
};

const AdminDashboard = ({ onNavigate, pendingReports, pendingVerifications, pendingPurchases, isAdmin }: AdminDashboardProps) => {
  const { data: stats, isLoading } = useQuickStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const onlinePercent = stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0;
  const verifiedPercent = stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0;

  const urgentActions = [
    { id: 'pending-tasks' as AdminSection, label: 'Missions', icon: ListOrdered, count: stats.pendingTasks, color: 'text-orange-500', bg: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { id: 'reports' as AdminSection, label: 'Signalements', icon: AlertTriangle, count: pendingReports, color: 'text-red-500', bg: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    { id: 'verification' as AdminSection, label: 'Vérifications', icon: IdCard, count: pendingVerifications, color: 'text-blue-500', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { id: 'credit-purchases' as AdminSection, label: 'Achats', icon: ShoppingCart, count: pendingPurchases, color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    { id: 'support' as AdminSection, label: 'Support', icon: Headphones, count: stats.openTickets, color: 'text-violet-500', bg: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
  ].filter(a => a.count > 0);

  return (
    <div className="space-y-6">
      {/* Urgent Actions Banner */}
      {urgentActions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold">Actions urgentes</h3>
            <Badge variant="secondary" className="text-[10px] h-5">
              {urgentActions.reduce((acc, a) => acc + a.count, 0)} en attente
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {urgentActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 rounded-xl border transition-all",
                  "hover:shadow-md active:scale-[0.98]",
                  action.borderColor, action.bg
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <action.icon className={cn("w-4 h-4", action.color)} />
                  <span className={cn("text-lg font-bold", action.color)}>{action.count}</span>
                </div>
                <span className="text-[11px] font-medium text-foreground/70">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Membres"
          value={stats.totalUsers}
          icon={Users}
          trend={`+${stats.newUsersToday} aujourd'hui`}
          onClick={() => onNavigate('users')}
        />
        <KPICard
          title="En ligne"
          value={stats.onlineUsers}
          icon={Activity}
          trend={`${onlinePercent}% actifs`}
          pulse
        />
        <KPICard
          title="Vérifiés"
          value={stats.verifiedUsers}
          icon={Shield}
          trend={`${verifiedPercent}%`}
          onClick={() => onNavigate('users')}
        />
        <KPICard
          title="Premium"
          value={stats.premiumUsers}
          icon={Crown}
          trend="abonnés"
        />
      </div>

      {/* Growth & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="overflow-hidden border-border/40">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-semibold">Croissance</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs font-bold">
                +{stats.newUsersWeek} / sem.
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Objectif hebdo</span>
                <span className="font-medium">{stats.newUsersWeek}/100</span>
              </div>
              <Progress value={Math.min((stats.newUsersWeek / 100) * 100, 100)} className="h-2" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Aujourd'hui: +{stats.newUsersToday}</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onNavigate('stats')}>
                Détails <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/40">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-semibold">Activité</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/40 text-center">
                <p className="text-xl font-bold">{stats.totalMessages.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total messages</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 text-center">
                <p className="text-xl font-bold">{stats.messagesWeek.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Cette semaine</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Moy. par utilisateur</span>
              <span className="font-semibold">
                {stats.totalUsers > 0 ? Math.round(stats.totalMessages / stats.totalUsers) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      {isAdmin && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Accès rapide</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {([
              { id: 'users' as AdminSection, label: 'Utilisateurs', icon: Users },
              { id: 'credits-surveillance' as AdminSection, label: 'Crédits', icon: TrendingUp },
              { id: 'moderators' as AdminSection, label: 'Équipe', icon: Eye },
              { id: 'broadcast' as AdminSection, label: 'Broadcast', icon: Globe },
              { id: 'maintenance' as AdminSection, label: 'Maintenance', icon: Shield },
              { id: 'stats' as AdminSection, label: 'Analytics', icon: Activity },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-all active:scale-[0.97]"
              >
                <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const KPICard = ({
  title, value, icon: Icon, trend, pulse, onClick
}: {
  title: string; value: number; trend?: string;
  icon: React.ElementType; pulse?: boolean; onClick?: () => void;
}) => (
  <Card
    className={cn(
      "overflow-hidden border-border/40 transition-all",
      onClick && "cursor-pointer hover:shadow-md hover:border-border/60 active:scale-[0.98]"
    )}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center">
          {pulse ? (
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          ) : (
            <Icon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        {trend && <span className="text-[10px] text-muted-foreground">{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
