import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, BookOpen, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQSearchPanelProps {
  onInsertResponse: (text: string) => void;
}

const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '');

const FAQSearchPanel = ({ onInsertResponse }: FAQSearchPanelProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: articles = [] } = useQuery({
    queryKey: ['faq-search-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalize(query);
    const words = q.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return [];

    return articles
      .map(a => {
        let score = 0;
        const nq = normalize(a.question);
        const na = normalize(a.answer);
        for (const w of words) {
          if (nq.includes(w)) score += 3;
          if (na.includes(w)) score += 1;
        }
        return { ...a, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query, articles]);

  const handleSendArticle = (article: typeof articles[0]) => {
    const formatted = `📖 **${article.question}**\n\n${article.answer}\n\n💡 *Pour plus d'informations, consulte le Centre d'aide.*`;
    onInsertResponse(formatted);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="border-t border-border bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Recherche FAQ
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans la FAQ..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm rounded-lg"
                  autoFocus
                />
                {query && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setQuery('')}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <ScrollArea className="max-h-64">
                  <div className="space-y-1.5">
                    {results.map(article => (
                      <div
                        key={article.id}
                        className="rounded-lg border border-border bg-background p-2.5"
                      >
                        <button
                          onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                          className="w-full text-left"
                        >
                          <p className="text-xs font-medium line-clamp-2">{article.question}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{article.category}</p>
                        </button>

                        <AnimatePresence>
                          {expandedId === article.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-muted-foreground mt-2 mb-2 line-clamp-4 whitespace-pre-wrap">{article.answer}</p>
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleSendArticle(article)}
                              >
                                <Send className="w-3 h-3" />
                                Envoyer au client
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {query.trim() && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">Aucun article trouvé</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQSearchPanel;
