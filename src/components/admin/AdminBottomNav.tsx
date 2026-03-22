import { memo } from 'react';
import { LayoutDashboard, Shield, Users, Wallet, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AdminSection } from './AdminSidebar';

type BottomTab = 'dashboard' | 'tasks' | 'moderation' | 'finances' | 'more';

interface AdminBottomNavProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  pendingCount?: number;
}

const tabs: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tâches', icon: Shield },
  { id: 'moderation', label: 'Modéra.', icon: Shield },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'more', label: 'Plus', icon: MoreHorizontal },
];

const AdminBottomNav = ({ activeTab, onTabChange, pendingCount = 0 }: AdminBottomNavProps) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {tab.id === 'tasks' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default memo(AdminBottomNav);
