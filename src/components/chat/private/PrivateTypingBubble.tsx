import { cn } from '@/lib/utils';

interface PrivateTypingBubbleProps {
  isTyping: boolean;
  avatar: string | null;
  username: string | undefined;
}

const PrivateTypingBubble = ({ isTyping, avatar, username }: PrivateTypingBubbleProps) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-end gap-2 mb-2">
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border/20">
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary text-xs font-semibold">
            {username?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="bg-secondary rounded-[20px] rounded-bl-[6px] px-4 py-3 flex items-center gap-2 shadow-[0_1px_2px_hsl(220_30%_20%/0.06)]">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default PrivateTypingBubble;
