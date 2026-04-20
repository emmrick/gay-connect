/**
 * AdminTopBar — barre supérieure mobile (admin) avec breadcrumb dynamique,
 * compteur d'alertes et accès rapide à la recherche (cmd+k).
 */
import { ArrowLeft, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminTopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  alertCount?: number;
  onAlertClick?: () => void;
  onSearchClick?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

const AdminTopBar = ({
  title,
  subtitle,
  showBack,
  onBack,
  alertCount = 0,
  onAlertClick,
  onSearchClick,
  rightSlot,
  className,
}: AdminTopBarProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-card/85 backdrop-blur-2xl border-b border-border/30",
        className,
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-1.5 px-2 h-14">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-11 h-11 rounded-xl shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : null}

        <div className="flex-1 min-w-0 px-1">
          <h1 className="font-display text-base font-bold leading-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="text-[11px] text-muted-foreground leading-tight truncate">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onSearchClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="w-11 h-11 rounded-xl text-muted-foreground"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </Button>
          ) : null}
          {onAlertClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAlertClick}
              className="relative w-11 h-11 rounded-xl text-muted-foreground"
              aria-label="Alertes"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 ? (
                <Badge className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground border-2 border-card text-[9px] font-bold flex items-center justify-center leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
