/**
 * ChatBotDialog visiteur — flow décisionnel à boutons.
 *
 * - Aucun champ de saisie : le visiteur clique uniquement sur les blocs créés
 *   par le propriétaire du profil.
 * - Aucun appel à un LLM en direct, aucune dépense de crédits visiteur.
 * - Affiche le breadcrumb pour revenir en arrière.
 */
import { useEffect, useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, Loader2, Sparkles, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatbotConfig, useChatbotReply, type ChatbotNode } from '@/hooks/useChatbotConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatBotDialogProps {
  profileUserId: string;
  profileUsername: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BubbleEntry {
  type: 'bot' | 'user';
  text: string;
  nodeId?: string;
}

const ChatBotDialog = ({ profileUserId, profileUsername, open, onOpenChange }: ChatBotDialogProps) => {
  const { data: config } = useChatbotConfig(profileUserId);
  const replyMutation = useChatbotReply();

  const [bubbles, setBubbles] = useState<BubbleEntry[]>([]);
  const [children, setChildren] = useState<ChatbotNode[]>([]);
  const [stack, setStack] = useState<ChatbotNode[]>([]); // breadcrumb

  const greeting = config?.greeting_message ||
    `Salut ! Je suis le chatbot de ${profileUsername}. Choisis un sujet ! 😊`;

  /* ─── Init / reload ─── */
  useEffect(() => {
    if (!open) return;
    setBubbles([{ type: 'bot', text: greeting }]);
    setStack([]);
    loadChildren(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileUserId]);

  const loadChildren = async (nodeId: string | null) => {
    try {
      const res = await replyMutation.mutateAsync({ profileUserId, nodeId });
      setChildren(res.children || []);
    } catch (e: any) {
      setBubbles(prev => [
        ...prev,
        { type: 'bot', text: 'Désolé, le ChatBot n\'est pas disponible pour le moment.' },
      ]);
    }
  };

  const handlePick = async (node: ChatbotNode) => {
    setBubbles(prev => [
      ...prev,
      { type: 'user', text: node.label },
      ...(node.response_text ? [{ type: 'bot' as const, text: node.response_text, nodeId: node.id }] : []),
    ]);
    setStack(prev => [...prev, node]);
    await loadChildren(node.id);
  };

  const handleBack = async () => {
    if (stack.length === 0) return;
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    const target = newStack[newStack.length - 1] || null;
    setBubbles(prev => [...prev, { type: 'bot', text: '↩︎ Retour' }]);
    await loadChildren(target?.id || null);
  };

  const handleHome = async () => {
    setStack([]);
    setBubbles(prev => [...prev, { type: 'bot', text: '🏠 Retour au menu principal' }]);
    await loadChildren(null);
  };

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
                  <DialogTitle className="text-base font-bold truncate">{profileUsername}</DialogTitle>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <p className="text-[11px] text-muted-foreground font-medium">ChatBot · En ligne</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Breadcrumb */}
            {stack.length > 0 && (
              <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-hide">
                <button onClick={handleHome} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0">
                  <Home className="w-3 h-3" /> Menu
                </button>
                {stack.map((n, i) => (
                  <span key={n.id} className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className={cn(i === stack.length - 1 && 'text-foreground font-medium')}>{n.label}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <AnimatePresence>
                {bubbles.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-2.5', b.type === 'user' && 'justify-end')}
                  >
                    {b.type === 'bot' && (
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/20">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border',
                        b.type === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md border-primary/80 shadow-sm shadow-primary/20'
                          : 'bg-secondary/60 backdrop-blur-sm rounded-tl-md border-border/30',
                      )}
                    >
                      <p className="whitespace-pre-wrap">{b.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {replyMutation.isPending && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/60 rounded-2xl rounded-tl-md px-4 py-3 border border-border/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Boutons d'options */}
        <div className="flex-shrink-0 border-t border-border/40 bg-secondary/20 backdrop-blur-sm">
          {stack.length > 0 && (
            <div className="px-3 pt-2.5">
              <Button
                variant="ghost" size="sm"
                onClick={handleBack}
                className="h-7 text-[11px] gap-1 text-muted-foreground"
              >
                <ChevronLeft className="w-3 h-3" /> Retour
              </Button>
            </div>
          )}
          <div className="p-3 space-y-1.5 max-h-[40vh] overflow-y-auto">
            {children.length === 0 && !replyMutation.isPending ? (
              <div className="text-center py-3 text-[11px] text-muted-foreground">
                {stack.length > 0
                  ? 'Pas d\'autre sous-question ici. Reviens en arrière ou retourne au menu.'
                  : 'Le ChatBot n\'a aucun bloc configuré pour le moment.'}
              </div>
            ) : (
              children.map((n, i) => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handlePick(n)}
                  disabled={replyMutation.isPending}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium',
                    'bg-card border border-primary/20 text-foreground',
                    'hover:bg-primary/10 hover:border-primary/40 hover:scale-[1.01]',
                    'active:scale-[0.99] transition-all',
                    'disabled:opacity-50',
                  )}
                >
                  {n.label}
                </motion.button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBotDialog;
