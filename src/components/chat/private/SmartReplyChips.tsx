import { Sparkles, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartReplyChipsProps {
  suggestions: string[];
  isLoading: boolean;
  onPick: (text: string) => void;
  onDismiss: () => void;
}

const SmartReplyChips = ({ suggestions, isLoading, onPick, onDismiss }: SmartReplyChipsProps) => {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        'px-3 pt-2 pb-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide',
        'bg-gradient-to-b from-background/0 via-background/60 to-background/85 backdrop-blur-md',
        'border-b border-border/30 animate-in fade-in slide-in-from-bottom-1 duration-300',
      )}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>

      {isLoading && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground italic">
          <Loader2 className="w-3 h-3 animate-spin" />
          Suggestions…
        </div>
      ) : (
        <>
          {suggestions.map((s, i) => (
            <button
              key={`${i}-${s}`}
              type="button"
              onClick={() => onPick(s)}
              className={cn(
                'flex-shrink-0 max-w-[220px] truncate text-[13px] font-medium px-3.5 py-1.5 rounded-full',
                'bg-card/80 border border-border/60 text-foreground',
                'shadow-[0_1px_3px_-1px_hsl(var(--foreground)/0.15)]',
                'hover:bg-primary/10 hover:border-primary/40 hover:text-primary hover:scale-[1.03]',
                'active:scale-95 transition-all duration-150',
              )}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Masquer les suggestions"
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default SmartReplyChips;
