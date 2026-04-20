/**
 * Fil d'Ariane affiché en haut du chatbot d'aide.
 */
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import type { HelpBreadcrumbStep } from '@/lib/help/helpFlow.types';

interface HelpBreadcrumbProps {
  steps: HelpBreadcrumbStep[];
  onNavigate: (id: string) => void;
}

const HelpBreadcrumb = ({ steps, onNavigate }: HelpBreadcrumbProps) => {
  if (steps.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-4 py-2 text-[11px] text-muted-foreground overflow-x-auto scrollbar-none border-b border-border/40 bg-background/60 backdrop-blur-sm"
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
            <button
              onClick={() => !isLast && onNavigate(step.id)}
              disabled={isLast}
              className={
                isLast
                  ? 'font-semibold text-foreground'
                  : 'hover:text-primary transition-colors'
              }
            >
              {i === 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  {step.label}
                </span>
              ) : (
                step.label
              )}
            </button>
          </div>
        );
      })}
    </motion.div>
  );
};

export default HelpBreadcrumb;
