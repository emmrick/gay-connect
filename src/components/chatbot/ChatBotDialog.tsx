import { useState, useRef, useEffect } from 'react';
import { Bot, ArrowLeft, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatbotConfig, useChatbotNodes, ChatbotNode } from '@/hooks/useChatbotConfig';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatBotDialogProps {
  profileUserId: string;
  profileUsername: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BotMessage {
  type: 'bot' | 'user';
  text: string;
}

const ChatBotDialog = ({ profileUserId, profileUsername, open, onOpenChange }: ChatBotDialogProps) => {
  const { data: config } = useChatbotConfig(profileUserId);
  const { data: allNodes = [] } = useChatbotNodes(profileUserId);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [navigationStack, setNavigationStack] = useState<(string | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const greeting = config?.greeting_message || `Salut ! Je suis le chatbot de ${profileUsername}. Comment puis-je t'aider ? 😊`;

  // Get root nodes or children of current parent
  const currentOptions = allNodes.filter(n =>
    currentParentId === null ? n.is_root : n.parent_id === currentParentId
  );

  // Reset on open
  useEffect(() => {
    if (open) {
      setMessages([]);
      setCurrentParentId(null);
      setNavigationStack([]);
      setIsTyping(false);
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping, currentOptions.length]);

  const handleOptionClick = (node: ChatbotNode) => {
    // Add user "click" as message
    setMessages(prev => [...prev, { type: 'user', text: node.label }]);

    // If node has a response, show it with typing delay
    if (node.response_text) {
      setIsTyping(true);
      const wordCount = node.response_text.split(/\s+/).length;
      const delay = Math.min(Math.max(wordCount * 200, 800), 3000);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { type: 'bot', text: node.response_text! }]);

        // Check if this node has children
        const children = allNodes.filter(n => n.parent_id === node.id);
        if (children.length > 0) {
          setNavigationStack(prev => [...prev, currentParentId]);
          setCurrentParentId(node.id);
        }
      }, delay);
    } else {
      // No response, just navigate to children
      const children = allNodes.filter(n => n.parent_id === node.id);
      if (children.length > 0) {
        setNavigationStack(prev => [...prev, currentParentId]);
        setCurrentParentId(node.id);
      }
    }
  };

  const handleBack = () => {
    if (navigationStack.length > 0) {
      const prevParentId = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentParentId(prevParentId);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentParentId(null);
    setNavigationStack([]);
  };

  const hasNodes = allNodes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 h-[85vh] max-h-[650px] flex flex-col overflow-hidden border-border/30 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-0">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative p-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center ring-2 ring-primary/20">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-40" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-bold truncate">
                    {profileUsername}
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Assistant • En ligne
                  </p>
                </div>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="p-4 space-y-4">
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/20">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1 max-w-[80%]">
                  <div className="bg-secondary/60 backdrop-blur-sm rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-border/30">
                    <p className="text-sm leading-relaxed">{greeting}</p>
                  </div>
                </div>
              </motion.div>

              {/* Messages */}
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={`msg-${i}`}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn('flex gap-2.5', msg.type === 'user' && 'justify-end')}
                  >
                    {msg.type === 'bot' && (
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/20">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="space-y-1 max-w-[80%]">
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border',
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-md border-primary/80 shadow-sm shadow-primary/20'
                            : 'bg-secondary/60 backdrop-blur-sm rounded-tl-md border-border/30'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/60 backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-3 border border-border/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-muted-foreground ml-1.5">en train d'écrire...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Options buttons */}
              {!isTyping && hasNodes && currentOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2 pl-10"
                >
                  {currentOptions.map((node) => (
                    <motion.button
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleOptionClick(node)}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                    >
                      {node.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* No nodes configured */}
              {!hasNodes && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pl-10"
                >
                  <p className="text-xs text-muted-foreground italic">
                    Ce chatbot n'a pas encore été configuré par {profileUsername}.
                  </p>
                </motion.div>
              )}

              {/* No more options (leaf node reached) */}
              {!isTyping && hasNodes && currentOptions.length === 0 && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pl-10 space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    Pour d'autres questions, contacte {profileUsername} directement 😊
                  </p>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <div className="p-3 bg-secondary/20 backdrop-blur-sm flex items-center gap-2">
            {navigationStack.length > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary/60 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary/60 text-muted-foreground hover:bg-secondary transition-colors ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                Recommencer
              </button>
            )}
            {messages.length === 0 && (
              <p className="text-[10px] text-muted-foreground/70 font-medium w-full text-center">
                Sélectionnez une option pour continuer
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBotDialog;
