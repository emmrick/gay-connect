import { memo } from 'react';
import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RadiusValue = 5 | 10 | 25 | 50 | 100 | 0; // 0 = illimité

const OPTIONS: { value: RadiusValue; label: string }[] = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 0, label: '∞' },
];

interface RadiusSelectorProps {
  value: RadiusValue;
  onChange: (value: RadiusValue) => void;
  disabled?: boolean;
}

const RadiusSelector = memo(({ value, onChange, disabled }: RadiusSelectorProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium flex-shrink-0">
        <Compass className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline">Rayon :</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {OPTIONS.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              aria-pressed={isActive}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

RadiusSelector.displayName = 'RadiusSelector';

export default RadiusSelector;
