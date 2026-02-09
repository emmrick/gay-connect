import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, X, EyeOff, MessageSquare, TrendingUp } from 'lucide-react';

const SwipeStatsPanel = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-swipe-stats'],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [totalResult, todayResult, weekResult, byTypeResult] = await Promise.all([
        supabase.from('swipe_actions').select('*', { count: 'exact', head: true }),
        supabase.from('swipe_actions').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('swipe_actions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('swipe_actions').select('action_type, credits_spent').order('created_at', { ascending: false }).limit(500),
      ]);

      const actions = byTypeResult.data || [];
      const likes = actions.filter(a => a.action_type === 'like').length;
      const dislikes = actions.filter(a => a.action_type === 'dislike').length;
      const hides = actions.filter(a => a.action_type === 'hide').length;
      const totalCreditsSpent = actions.reduce((sum, a) => sum + (Number(a.credits_spent) || 0), 0);

      return {
        total: totalResult.count || 0,
        today: todayResult.count || 0,
        week: weekResult.count || 0,
        likes,
        dislikes,
        hides,
        totalCreditsSpent,
      };
    },
    refetchInterval: 30000,
  });

  // Recent swipe actions
  const { data: recentActions = [] } = useQuery({
    queryKey: ['admin-recent-swipes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('swipe_actions')
        .select('*, profiles!swipe_actions_user_id_fkey(username)')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get usernames manually
      if (!data?.length) return [];
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      return data.map(action => ({
        ...action,
        username: profiles?.find(p => p.user_id === action.user_id)?.username || 'Inconnu',
      }));
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total swipes", value: stats?.total || 0, icon: TrendingUp, color: 'text-primary' },
    { label: "Aujourd'hui", value: stats?.today || 0, icon: TrendingUp, color: 'text-primary' },
    { label: "Cette semaine", value: stats?.week || 0, icon: TrendingUp, color: 'text-primary' },
    { label: "Crédits dépensés", value: `${(stats?.totalCreditsSpent || 0).toFixed(1)}`, icon: TrendingUp, color: 'text-primary' },
  ];

  const typeCards = [
    { label: "Likes", value: stats?.likes || 0, icon: Heart, color: 'text-green-500' },
    { label: "Dislikes", value: stats?.dislikes || 0, icon: X, color: 'text-destructive' },
    { label: "Masqués", value: stats?.hides || 0, icon: EyeOff, color: 'text-muted-foreground' },
  ];

  const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
    like: { icon: Heart, color: 'text-green-500' },
    dislike: { icon: X, color: 'text-destructive' },
    hide: { icon: EyeOff, color: 'text-muted-foreground' },
    start_conversation: { icon: MessageSquare, color: 'text-primary' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Statistiques Swipe</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/80 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {typeCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card/80 border-border/50">
              <CardContent className="p-3 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Actions récentes</p>
        <ScrollArea className="h-64">
          <div className="space-y-1.5">
            {recentActions.map((action: any) => {
              const config = actionIcons[action.action_type] || actionIcons.like;
              const Icon = config.icon;
              return (
                <div key={action.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="font-medium">{action.username}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-xs text-muted-foreground">{action.action_type}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    -{Number(action.credits_spent).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SwipeStatsPanel;
