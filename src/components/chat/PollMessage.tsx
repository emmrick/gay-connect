import { useState } from 'react';
import { BarChart3, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Poll } from '@/hooks/usePolls';

interface PollMessageProps {
  poll: Poll;
  isOwn: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onLock?: (pollId: string) => void;
}

const PollMessage = ({ poll, isOwn, onVote, onLock }: PollMessageProps) => {
  const [showResults, setShowResults] = useState(false);
  const hasVoted = poll.options.some(o => o.hasVoted);
  const shouldShowResults = hasVoted || showResults || poll.is_locked;

  return (
    <div className={cn(
      "rounded-2xl p-4 max-w-[320px] w-full",
      isOwn
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium opacity-80">
          Sondage{poll.is_multiple_choice ? ' (choix multiple)' : ''}
        </span>
        {poll.is_locked && <Lock className="w-3.5 h-3.5 opacity-60" />}
      </div>

      {/* Question */}
      <p className="font-semibold text-sm mb-3 leading-snug">{poll.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map(option => {
          const percentage = poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;

          return (
            <button
              key={option.id}
              onClick={() => !poll.is_locked && onVote(poll.id, option.id)}
              disabled={poll.is_locked}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left transition-all relative overflow-hidden",
                "border",
                poll.is_locked ? "cursor-default" : "cursor-pointer active:scale-[0.98]",
                option.hasVoted
                  ? isOwn
                    ? "border-primary-foreground/40 bg-primary-foreground/15"
                    : "border-primary/40 bg-primary/10"
                  : isOwn
                    ? "border-primary-foreground/20 hover:border-primary-foreground/40"
                    : "border-border hover:border-primary/30"
              )}
            >
              {/* Progress bar background */}
              {shouldShowResults && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isOwn ? "bg-primary-foreground/10" : "bg-primary/8"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {option.hasVoted && (
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                  )}
                  <span className="text-sm truncate">{option.option_text}</span>
                </div>
                {shouldShowResults && (
                  <span className="text-xs font-medium opacity-70 flex-shrink-0 tabular-nums">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-[11px] opacity-60">
        <span>{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {!shouldShowResults && (
            <button
              onClick={() => setShowResults(true)}
              className="underline hover:opacity-80"
            >
              Voir résultats
            </button>
          )}
          {isOwn && !poll.is_locked && onLock && (
            <button
              onClick={() => onLock(poll.id)}
              className="underline hover:opacity-80"
            >
              Verrouiller
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollMessage;
