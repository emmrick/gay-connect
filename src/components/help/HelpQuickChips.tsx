/**
 * Liste de chips cliquables affichées sous une bulle bot ou en bas de l'écran.
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface HelpChip {
  id: string;
  label: string;
  emoji?: string;
  variant?: 'subtle' | 'outline';
}

interface HelpQuickChipsProps {
  chips: HelpChip[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  layout?: 'wrap' | 'grid';
}

const HelpQuickChips = ({ chips, onSelect, disabled, layout = 'wrap' }: HelpQuickChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
      className={cn(
        'mt-2.5',
        layout === 'grid' ? 'grid grid-cols-2 gap-1.5' : 'flex flex-wrap gap-1.5'
      )}
    >
      {chips.map((chip) => {
        const isOutline = chip.variant === 'outline';
        return (
          <button
            key={chip.id}
            onClick={() => onSelect(chip.id)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-[12px] font-medium rounded-full transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-left',
              isOutline
                ? 'border border-border/60 bg-card/60 backdrop-blur-sm text-foreground hover:bg-primary/10 hover:border-primary/30'
                : 'border border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40'
            )}
          >
            {chip.emoji ? `${chip.emoji} ${chip.label}` : chip.label}
          </button>
        );
      })}
    </motion.div>
  );
};

export default HelpQuickChips;
