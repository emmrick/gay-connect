import { Zap, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanNowSession, usePlanNowCountdown } from '@/hooks/usePlanNowSession';
import { useState } from 'react';
import PlanNowSettingsSheet from './PlanNowSettingsSheet';

/**
 * Bandeau affiché dans la messagerie privée quand l'utilisateur a une session
 * Plan Now active et que les auto-réponses sont activées.
 */
const PlanNowComposerBanner = () => {
  const { activeSession, isActive } = usePlanNowSession();
  const { label } = usePlanNowCountdown(activeSession?.expires_at);
  const [open, setOpen] = useState(false);

  if (!isActive) return null;

  return (
    <>
      <div
        className={cn(
          'mx-3 mt-2 mb-1 px-3 py-2 rounded-xl flex items-center gap-2',
          'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15',
          'border border-amber-500/30',
        )}
      >
        <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-current flex-shrink-0" />
        <p className="text-[12px] flex-1 text-foreground/90 leading-tight">
          <span className="font-semibold">Plan Now actif</span>
          <span className="text-muted-foreground"> · auto-réponses · {label}</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline inline-flex items-center gap-1"
        >
          <Settings2 className="w-3 h-3" />
          Personnaliser
        </button>
      </div>
      <PlanNowSettingsSheet open={open} onOpenChange={setOpen} />
    </>
  );
};

export default PlanNowComposerBanner;
