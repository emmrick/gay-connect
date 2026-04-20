/**
 * AdminBreadcrumbs — fil d'Ariane desktop pour la top bar admin.
 * Format : Admin › Groupe › Section
 */
import { ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { AdminSection } from './AdminSidebar';
import {
  buildAdminPath,
  groupForSection,
  groupLabels,
  titleForSection,
} from '@/config/adminRoutes';

interface Props {
  section: AdminSection;
  className?: string;
}

const AdminBreadcrumbs = ({ section, className }: Props) => {
  const navigate = useNavigate();
  const group = groupForSection(section);
  const isDashboard = section === 'dashboard';

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center gap-1 text-xs min-w-0', className)}
    >
      <button
        type="button"
        onClick={() => navigate(buildAdminPath('dashboard'), { replace: true })}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Tableau de bord admin"
      >
        <Home className="w-3 h-3" />
        <span className="hidden md:inline">Admin</span>
      </button>

      {!isDashboard && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
          <span className="px-1.5 py-0.5 text-muted-foreground/80 font-medium truncate">
            {groupLabels[group]}
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
          <span className="px-1.5 py-0.5 font-display font-semibold text-foreground truncate">
            {titleForSection(section)}
          </span>
        </>
      )}
    </nav>
  );
};

export default AdminBreadcrumbs;
