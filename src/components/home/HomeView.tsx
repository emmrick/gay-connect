import { useAuth } from '@/contexts/AuthContext';
import { useOnlineMemberCounts } from '@/hooks/useOnlineMemberCounts';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Users, MessageCircle, MapPin, Sparkles, ChevronRight, Zap, Heart, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HomeViewProps {
  onNavigateToGroups: () => void;
  onNavigateToMessages: () => void;
  onSelectRegion: (regionCode: string) => void;
}

const HomeView = ({ onNavigateToGroups, onNavigateToMessages, onSelectRegion }: HomeViewProps) => {
  const { profile } = useAuth();
  const { data: rooms } = useChatRooms();
  const { data: onlineCounts } = useOnlineMemberCounts();
  const { getTotalUnreadCount } = useUnreadMessages();

  // Get total online users
  const totalOnline = Object.values(onlineCounts || {}).reduce((sum, count) => sum + count, 0);
  
  // Get user's region room
  const userRegionRoom = rooms?.find(room => room.region_code === profile?.region);
  const userRegionOnline = profile?.region ? (onlineCounts?.[profile.region] || 0) : 0;

  // Get top 4 active regions
  const topRegions = rooms
    ?.map(room => ({
      ...room,
      onlineCount: onlineCounts?.[room.region_code] || 0
    }))
    .sort((a, b) => b.onlineCount - a.onlineCount)
    .slice(0, 4) || [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-5 pt-8 pb-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 animate-fade-in">
              <Avatar className="w-14 h-14 ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                  {profile?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">{greeting()}</p>
                <h1 className="font-display text-xl font-bold text-foreground">
                  {profile?.username || 'Bienvenue'} 👋
                </h1>
              </div>
            </div>
            
            {/* Notification indicator */}
            {getTotalUnreadCount() > 0 && (
              <button 
                onClick={onNavigateToMessages}
                className="relative p-3 rounded-xl bg-secondary/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all animate-scale-in"
              >
                <MessageCircle className="w-5 h-5 text-foreground" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
                  {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
                </span>
              </button>
            )}
          </div>

          {/* Live Stats Banner */}
          <div className="glass-card rounded-2xl p-4 mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-foreground">{totalOnline} membres en ligne</span>
                </div>
                <p className="text-xs text-muted-foreground">Rejoins la communauté maintenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <StatCard 
            icon={<Users className="w-4 h-4" />}
            value={rooms?.length || 0}
            label="Groupes"
            color="primary"
          />
          <StatCard 
            icon={<Heart className="w-4 h-4" />}
            value={totalOnline}
            label="Actifs"
            color="accent"
          />
          <StatCard 
            icon={<Camera className="w-4 h-4" />}
            value={getTotalUnreadCount()}
            label="Non lus"
            color="destructive"
            onClick={onNavigateToMessages}
          />
        </div>

        {/* User's Region Card */}
        {userRegionRoom && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-foreground text-sm">Ta région</h2>
            </div>
            <button
              onClick={() => onSelectRegion(userRegionRoom.region_code)}
              className="w-full group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white text-xl shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                    {userRegionRoom.region_code}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-1">
                      {userRegionRoom.region_name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {userRegionOnline > 0 ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm text-muted-foreground">{userRegionOnline} en ligne</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Rejoindre le groupe</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Active Regions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="font-display font-semibold text-foreground text-sm">Régions populaires</h2>
            </div>
            <button 
              onClick={onNavigateToGroups}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Tout voir →
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {topRegions.map((room, index) => (
              <RegionCard
                key={room.id}
                regionCode={room.region_code}
                regionName={room.region_name}
                onlineCount={room.onlineCount}
                onClick={() => onSelectRegion(room.region_code)}
                delay={index * 0.05}
              />
            ))}
          </div>
          
          {topRegions.length === 0 && (
            <div className="text-center py-8 rounded-2xl bg-secondary/30">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune région active</p>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <ActionCard
            icon={<Users className="w-6 h-6" />}
            title="Explorer"
            subtitle="Tous les groupes"
            onClick={onNavigateToGroups}
            gradient="from-primary/80 to-primary"
          />
          <ActionCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Messages"
            subtitle="Conversations"
            onClick={onNavigateToMessages}
            gradient="from-accent/80 to-accent"
            badge={getTotalUnreadCount() > 0 ? getTotalUnreadCount() : undefined}
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'primary' | 'accent' | 'destructive';
  onClick?: () => void;
}

const StatCard = ({ icon, value, label, color, onClick }: StatCardProps) => {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/10 text-primary',
    accent: 'from-accent/20 to-accent/10 text-accent',
    destructive: 'from-destructive/20 to-destructive/10 text-destructive',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br border border-border/30 transition-all duration-200",
        colorClasses[color],
        onClick && "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      )}
    >
      <div className="mb-1">{icon}</div>
      <span className="font-display text-xl font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </button>
  );
};

// Region Card Component
interface RegionCardProps {
  regionCode: string;
  regionName: string;
  onlineCount: number;
  onClick: () => void;
  delay: number;
}

const RegionCard = ({ regionCode, regionName, onlineCount, onClick, delay }: RegionCardProps) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center p-4 rounded-xl bg-secondary/50 border border-border/30 hover:border-primary/50 hover:bg-secondary/80 transition-all duration-300 animate-fade-in"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white text-sm shadow-lg group-hover:scale-105 transition-transform duration-300 mb-3">
      {regionCode}
    </div>
    <h3 className="font-medium text-foreground text-sm text-center line-clamp-1 mb-1">{regionName}</h3>
    <div className="flex items-center gap-1.5">
      {onlineCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      <span className="text-[10px] text-muted-foreground">
        {onlineCount > 0 ? `${onlineCount} en ligne` : 'Hors ligne'}
      </span>
    </div>
  </button>
);

// Action Card Component
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  gradient: string;
  badge?: number;
}

const ActionCard = ({ icon, title, subtitle, onClick, gradient, badge }: ActionCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
      "bg-gradient-to-br", gradient
    )}
  >
    {/* Decorative circle */}
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
    
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full bg-white text-primary text-xs flex items-center justify-center font-bold shadow-lg">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
    
    <div className="relative z-10">
      <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-3">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-xs text-white/70">{subtitle}</p>
    </div>
  </button>
);

export default HomeView;
