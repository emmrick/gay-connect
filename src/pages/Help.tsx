import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, MessageCircle, Headphones, HelpCircle, Bot, X, Send, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFAQArticles, useHelpChatbotNodes, type HelpChatbotNode } from '@/hooks/useFAQ';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import SupportChatRoom from '@/components/support/SupportChatRoom';
import SupportTicketList from '@/components/support/SupportTicketList';
import { cn } from '@/lib/utils';

const Help = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotHistory, setChatbotHistory] = useState<{ type: 'bot' | 'user'; text: string }[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [showContactAgent, setShowContactAgent] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTickets, setShowTickets] = useState(false);

  const { data: faqArticles = [], isLoading: faqLoading } = useFAQArticles(searchQuery);
  const { data: rootNodes = [] } = useHelpChatbotNodes(undefined);
  const { data: childNodes = [] } = useHelpChatbotNodes(currentNodeId);
  const { createTicket } = useSupportTickets();

  // Init chatbot greeting
  useEffect(() => {
    if (showChatbot && chatbotHistory.length === 0 && rootNodes.length > 0) {
      setChatbotHistory([{
        type: 'bot',
        text: 'Bonjour ! 👋 Je suis l\'assistant du support. Comment puis-je vous aider ? Sélectionnez une option ci-dessous.',
      }]);
    }
  }, [showChatbot, rootNodes]);

  const currentOptions = currentNodeId ? childNodes : rootNodes;

  const handleSelectOption = (node: HelpChatbotNode) => {
    const newHistory = [
      ...chatbotHistory,
      { type: 'user' as const, text: node.label },
    ];

    if (node.response_text) {
      newHistory.push({ type: 'bot' as const, text: node.response_text });
    }

    setChatbotHistory(newHistory);
    setCurrentNodeId(node.id);
  };

  const handleContactAgent = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const ticket = await createTicket.mutateAsync("Demande d'assistance via chatbot");
      setShowChatbot(false);
      setSelectedTicket(ticket);
    } catch {
      // error handled by hook
    }
  };

  const handleResetChatbot = () => {
    setChatbotHistory([{
      type: 'bot',
      text: 'Bonjour ! 👋 Je suis l\'assistant du support. Comment puis-je vous aider ? Sélectionnez une option ci-dessous.',
    }]);
    setCurrentNodeId(null);
    setShowContactAgent(false);
  };

  // Grouped FAQ by category
  const groupedFAQ = faqArticles.reduce((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, typeof faqArticles>);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Centre d'aide</h2>
          <p className="text-muted-foreground mb-4">Connectez-vous pour accéder au centre d'aide.</p>
          <Button onClick={() => navigate('/auth')}>Se connecter</Button>
        </Card>
      </div>
    );
  }

  // Show support chat room  
  if (selectedTicket) {
    return (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <SupportChatRoom
          ticket={selectedTicket}
          onBack={() => setSelectedTicket(null)}
        />
      </motion.div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="px-4 pb-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold">Centre d'aide</h1>
            <p className="text-xs text-muted-foreground">FAQ & Support client</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setShowTickets(!showTickets)}
          >
            <Headphones className="w-4 h-4" />
            Mes tickets
          </Button>
        </div>

        {/* Search */}
        {!showTickets && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {showTickets ? (
          <div className="p-4">
            <SupportTicketList onSelectTicket={(ticket) => setSelectedTicket(ticket)} />
          </div>
        ) : (
          <div className="p-4 space-y-6 pb-24">
            {/* FAQ Section */}
            {faqArticles.length === 0 && !faqLoading ? (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">
                  {searchQuery ? 'Aucun résultat' : 'FAQ bientôt disponible'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {searchQuery 
                    ? 'Essayez avec d\'autres mots-clés ou contactez le support.'
                    : 'Les articles d\'aide seront bientôt disponibles. En attendant, vous pouvez contacter le support.'
                  }
                </p>
              </div>
            ) : (
              Object.entries(groupedFAQ).map(([category, articles]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs capitalize">{category}</Badge>
                    <span className="text-xs text-muted-foreground">{articles.length} article{articles.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {articles.map((article) => (
                      <Card
                        key={article.id}
                        className={cn(
                          "overflow-hidden transition-all cursor-pointer",
                          expandedFAQ === article.id ? "ring-1 ring-primary/30" : ""
                        )}
                        onClick={() => setExpandedFAQ(expandedFAQ === article.id ? null : article.id)}
                      >
                        <div className="px-4 py-3 flex items-center justify-between">
                          <p className="font-medium text-sm flex-1">{article.question}</p>
                          <ChevronRight className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2",
                            expandedFAQ === article.id && "rotate-90"
                          )} />
                        </div>
                        <AnimatePresence>
                          {expandedFAQ === article.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 border-t border-border pt-3">
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{article.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Prochainement section for chatbot */}
            {rootNodes.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <Bot className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">Chatbot d'assistance</h3>
                <p className="text-sm text-muted-foreground">Prochainement disponible</p>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Floating chat bubble */}
      {!showTickets && !selectedTicket && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (rootNodes.length > 0) {
              setShowChatbot(true);
            } else {
              handleContactAgent();
            }
          }}
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center z-50"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      {/* Chatbot Sheet */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Chatbot Header */}
            <div 
              className="border-b border-border px-4 py-3 flex items-center gap-3"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
            >
              <Button variant="ghost" size="icon" onClick={() => setShowChatbot(false)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Assistant Support</p>
                  <p className="text-xs text-green-500">En ligne</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetChatbot} className="text-xs">
                Recommencer
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-lg mx-auto">
                {chatbotHistory.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.type === 'user' 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted rounded-bl-sm"
                    )}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Options */}
            <div className="border-t border-border p-4 space-y-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
              {currentOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentOptions.map((node) => (
                    <Button
                      key={node.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleSelectOption(node)}
                    >
                      {node.label}
                    </Button>
                  ))}
                </div>
              ) : null}
              
              <Button
                onClick={handleContactAgent}
                className="w-full gap-2"
                variant={currentOptions.length === 0 ? "default" : "secondary"}
                disabled={createTicket.isPending}
              >
                <Headphones className="w-4 h-4" />
                {createTicket.isPending ? 'Connexion en cours...' : 'Contacter un Agent'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Help;
