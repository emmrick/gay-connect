import { Users, MessageCircle, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BottomNavBarProps {
  activeTab: 'home' | 'groups' | 'messages' | 'profile';
  onTabChange: (tab: 'home' | 'groups' | 'messages' | 'profile') => void;
  unreadCount?: number;
}

const BottomNavBar = ({ activeTab, onTabChange, unreadCount = 0 }: BottomNavBarProps) => {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Accueil' },
    { id: 'groups' as const, icon: Users, label: 'Groupes' },
    { id: 'messages' as const, icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <nav className="bg-secondary/95 backdrop-blur-lg border border-border rounded-2xl shadow-lg shadow-black/20">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  {tab.badge && tab.badge > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] bg-accent text-accent-foreground"
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavBar;
