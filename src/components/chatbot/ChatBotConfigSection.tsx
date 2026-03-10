import { useState } from 'react';
import { Bot, Plus, X, Power, MessageSquare, Loader2, ChevronRight, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  useChatbotConfig,
  useUpdateChatbotConfig,
  useChatbotNodes,
  useAddChatbotNode,
  useUpdateChatbotNode,
  useDeleteChatbotNode,
  ChatbotNode,
} from '@/hooks/useChatbotConfig';
import { useCredits, CREDIT_COSTS } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBotConfigSection = () => {
  const { data: config, isLoading: configLoading } = useChatbotConfig();
  const { data: nodes = [], isLoading: nodesLoading } = useChatbotNodes();
  const updateConfig = useUpdateChatbotConfig();
  const addNode = useAddChatbotNode();
  const updateNode = useUpdateChatbotNode();
  const deleteNode = useDeleteChatbotNode();
  const { deductCredits, hasEnoughCredits } = useCredits();

  const [editGreeting, setEditGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');

  // Node editing state
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [parentStack, setParentStack] = useState<(string | null)[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNode, setEditingNode] = useState<ChatbotNode | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editResponse, setEditResponse] = useState('');

  const isActive = config?.is_active || false;
  const greeting = config?.greeting_message || 'Salut ! Je suis le chatbot de ce profil. Choisis une option pour en savoir plus ! 😊';

  const isLoading = configLoading || nodesLoading;

  // Current level nodes
  const currentNodes = nodes.filter(n =>
    currentParentId === null ? n.is_root : n.parent_id === currentParentId
  );

  // Get parent node name for breadcrumb
  const currentParentNode = currentParentId ? nodes.find(n => n.id === currentParentId) : null;

  const handleToggle = async () => {
    if (!isActive) {
      if (!hasEnoughCredits(CREDIT_COSTS.chatbot_activate)) {
        toast.error(`Crédits insuffisants (${CREDIT_COSTS.chatbot_activate} crédits pour activer)`);
        return;
      }
      try {
        await deductCredits.mutateAsync({
          amount: CREDIT_COSTS.chatbot_activate,
          transactionType: 'chatbot_activate',
          description: 'Activation du ChatBot personnel',
        });
        updateConfig.mutate({ is_active: true });
      } catch {
        toast.error('Erreur lors de l\'activation');
      }
    } else {
      updateConfig.mutate({ is_active: false });
    }
  };

  const handleSaveGreeting = () => {
    if (greetingText.trim()) {
      updateConfig.mutate({ greeting_message: greetingText.trim() });
    }
    setEditGreeting(false);
  };

  const handleAddNode = async () => {
    if (!newLabel.trim()) return;
    try {
      await addNode.mutateAsync({
        parent_id: currentParentId,
        label: newLabel.trim(),
        response_text: newResponse.trim() || null,
        is_root: currentParentId === null,
        display_order: currentNodes.length,
      });
      setNewLabel('');
      setNewResponse('');
      setShowAddForm(false);
      toast.success('Option ajoutée !');
    } catch {
      // error handled in hook
    }
  };

  const handleUpdateNode = async () => {
    if (!editingNode || !editLabel.trim()) return;
    try {
      await updateNode.mutateAsync({
        id: editingNode.id,
        label: editLabel.trim(),
        response_text: editResponse.trim() || null,
      });
      setEditingNode(null);
      toast.success('Option mise à jour !');
    } catch {
      // error handled in hook
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    await deleteNode.mutateAsync(nodeId);
  };

  const navigateInto = (nodeId: string) => {
    setParentStack(prev => [...prev, currentParentId]);
    setCurrentParentId(nodeId);
    setShowAddForm(false);
    setEditingNode(null);
  };

  const navigateBack = () => {
    if (parentStack.length > 0) {
      const prev = parentStack[parentStack.length - 1];
      setParentStack(s => s.slice(0, -1));
      setCurrentParentId(prev);
      setShowAddForm(false);
      setEditingNode(null);
    }
  };

  const startEdit = (node: ChatbotNode) => {
    setEditingNode(node);
    setEditLabel(node.label);
    setEditResponse(node.response_text || '');
  };

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">ChatBot Personnel</h3>
              <p className="text-xs text-muted-foreground">
                {isActive ? '🟢 Actif' : '⚫ Inactif'}
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={updateConfig.isPending}
          />
        </div>

        {/* Description */}
        <div className="mb-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-xs text-foreground leading-relaxed">
            🤖 <span className="font-medium">Votre assistant automatique</span> guide les visiteurs de votre profil à travers un arbre de choix.
            Construisez des options et sous-options avec des réponses associées pour répondre aux questions fréquentes.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px]">🔓 Activation : {CREDIT_COSTS.chatbot_activate} crédits</Badge>
            <Badge variant="outline" className="text-[10px]">🆓 Gratuit pour les visiteurs</Badge>
          </div>
        </div>

        {/* Greeting message */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Message d'accueil
          </p>
          {editGreeting ? (
            <div className="space-y-2">
              <Textarea
                value={greetingText}
                onChange={(e) => setGreetingText(e.target.value)}
                placeholder="Message d'accueil..."
                className="text-sm min-h-[60px]"
                maxLength={200}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditGreeting(false)} className="text-xs">
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSaveGreeting} disabled={updateConfig.isPending} className="text-xs">
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setGreetingText(greeting); setEditGreeting(true); }}
              className="w-full text-left p-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
            >
              {greeting}
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50 mb-4" />

        {/* Flow builder */}
        <div>
          {/* Breadcrumb / Navigation */}
          <div className="flex items-center gap-2 mb-3">
            {currentParentId !== null && (
              <button
                onClick={navigateBack}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ArrowLeft className="w-3 h-3" />
                Retour
              </button>
            )}
            <p className="text-xs font-semibold text-foreground">
              {currentParentId === null ? '📋 Options principales' : `📂 Sous-options de "${currentParentNode?.label}"`}
            </p>
          </div>

          {/* Existing nodes */}
          <div className="space-y-2 mb-3">
            <AnimatePresence>
              {currentNodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="border border-border/40 rounded-xl p-3 bg-secondary/20"
                >
                  {editingNode?.id === node.id ? (
                    /* Edit mode */
                    <div className="space-y-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Texte du bouton..."
                        className="text-xs h-8"
                        maxLength={100}
                      />
                      <Textarea
                        value={editResponse}
                        onChange={(e) => setEditResponse(e.target.value)}
                        placeholder="Réponse du bot (optionnel)..."
                        className="text-xs min-h-[50px]"
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingNode(null)} className="text-xs h-7">
                          Annuler
                        </Button>
                        <Button size="sm" onClick={handleUpdateNode} disabled={updateNode.isPending} className="text-xs h-7">
                          Sauver
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{node.label}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(node)} className="p-1 rounded hover:bg-secondary transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDeleteNode(node.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                          </button>
                        </div>
                      </div>
                      {node.response_text && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{node.response_text}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {nodes.filter(n => n.parent_id === node.id).length} sous-option(s)
                        </span>
                        <button
                          onClick={() => navigateInto(node.id)}
                          className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
                        >
                          Gérer les sous-options
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {currentNodes.length === 0 && !showAddForm && (
              <p className="text-xs text-muted-foreground italic text-center py-3">
                Aucune option à ce niveau. Ajoutez-en une !
              </p>
            )}
          </div>

          {/* Add new node form */}
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-primary/30 rounded-xl p-3 bg-primary/5 space-y-2"
            >
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Texte du bouton (ex: Quel âge as-tu ?)"
                className="text-xs h-8"
                maxLength={100}
              />
              <Textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Réponse du bot (ex: J'ai 25 ans 😊). Laissez vide si cette option ouvre des sous-options."
                className="text-xs min-h-[60px]"
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowAddForm(false); setNewLabel(''); setNewResponse(''); }}
                  className="text-xs h-7"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNode}
                  disabled={!newLabel.trim() || addNode.isPending}
                  className="text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full text-xs h-8 border-dashed"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ajouter une option
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
          💡 Construisez un arbre de choix : chaque option peut afficher une réponse et/ou proposer des sous-options.
          Les visiteurs navigueront dans vos options sans utiliser d'IA.
        </p>
      </CardContent>
    </Card>
  );
};

export default ChatBotConfigSection;
