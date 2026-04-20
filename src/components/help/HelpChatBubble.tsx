/**
 * Bulle de message du chatbot d'aide — style iMessage premium.
 */
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HelpChatBubbleProps {
  type: 'bot' | 'user' | 'system';
  text: string;
  isTyping?: boolean;
  revealedLength?: number;
  children?: React.ReactNode;
}

const HelpInlineText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\[LINK:\/[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[LINK:(\/[^\]]+)\]$/);
        if (linkMatch) {
          const path = linkMatch[1];
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); window.location.href = path; }}
              className="inline-flex items-center gap-1 mt-1 px-3 py-1 text-[11px] font-semibold rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              👉 Accéder à la page
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const HelpChatBubble = ({ type, text, isTyping, revealedLength, children }: HelpChatBubbleProps) => {
  if (type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-2"
      >
        <div className="bg-muted/60 text-muted-foreground text-[11px] px-4 py-1.5 rounded-full text-center max-w-[85%]">
          <HelpInlineText text={text} />
        </div>
      </motion.div>
    );
  }

  const isUser = type === 'user';
  const displayText = isTyping ? text.slice(0, revealedLength || 0) : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mb-0.5 shadow-md shadow-primary/20">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className={cn('max-w-[80%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 text-[14.5px] leading-[1.45] whitespace-pre-line break-words rounded-[22px] transition-all',
            isUser
              ? 'bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground rounded-br-[7px] shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.35)]'
              : 'bg-secondary/90 backdrop-blur-sm text-foreground rounded-bl-[7px] shadow-[0_1px_3px_hsl(220_30%_20%/0.06),0_0_0_0.5px_hsl(var(--border)/0.6)]'
          )}
        >
          <HelpInlineText text={displayText} />
          {isTyping && (
            <span className="inline-block w-0.5 h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
};

export default HelpChatBubble;
