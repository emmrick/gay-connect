import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  isOwn: boolean;
}

const MessageReactions = ({ reactions, onToggleReaction, isOwn }: MessageReactionsProps) => {
  if (reactions.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-1 mt-1",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
            "hover:scale-105 active:scale-95",
            reaction.hasReacted
              ? "bg-primary/20 border border-primary/40 text-primary"
              : "bg-secondary border border-border text-muted-foreground hover:border-primary/30"
          )}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};

export default MessageReactions;
