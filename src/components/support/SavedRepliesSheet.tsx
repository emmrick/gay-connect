import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, MessageSquareText, Trash2, Plus, X, Edit2, Check, Zap, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useModeratorSavedReplies, SavedReply } from '@/hooks/useModeratorSavedReplies';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface QuickReply {
  label: string;
  content: string;
}

interface QuickReplyCategory {
  category: string;
  emoji: string;
  replies: QuickReply[];
}

const CATEGORIZED_REPLIES: QuickReplyCategory[] = [
  {
    category: 'Accueil & Clôture',
    emoji: '👋',
    replies: [
      { label: '👋 Accueil', content: 'Bonjour ! Je suis votre conseiller. Comment puis-je vous aider aujourd\'hui ?' },
      { label: '👋 Accueil formel', content: 'Bonjour et bienvenue sur le support GaySocial ! Je suis à votre disposition pour répondre à toutes vos questions. Comment puis-je vous aider ?' },
      { label: '🌙 Accueil soir', content: 'Bonsoir ! Merci de nous contacter. Je suis là pour vous aider, dites-moi ce dont vous avez besoin.' },
      { label: '👋 Clôture', content: 'Merci pour votre patience. Je vais maintenant clôturer ce ticket. Bonne continuation sur GaySocial ! 💜' },
      { label: '👋 Clôture + feedback', content: 'Votre demande a été traitée avec succès ! Si vous avez un moment, n\'hésitez pas à nous donner votre avis sur cette interaction. Bonne journée ! 💜' },
      { label: '🙏 Remerciement', content: 'Merci beaucoup pour votre retour et votre confiance ! N\'hésitez pas à nous recontacter si vous avez d\'autres questions.' },
    ],
  },
  {
    category: 'Attente & Suivi',
    emoji: '⏳',
    replies: [
      { label: '⏳ Patience', content: 'Je vérifie cela de mon côté, un instant s\'il vous plaît.' },
      { label: '⏳ En cours', content: 'Votre demande est en cours de traitement. Je reviendrai vers vous dès que possible avec une réponse. Merci de patienter.' },
      { label: '🔍 Investigation', content: 'Je vais examiner votre situation en détail. Cela peut prendre quelques minutes, je vous recontacterai dès que j\'ai des informations.' },
      { label: '📋 Infos nécessaires', content: 'Pour traiter votre demande, j\'aurais besoin des informations suivantes :\n- Votre nom d\'utilisateur\n- La date du problème\n- Une description détaillée' },
      { label: '📸 Capture nécessaire', content: 'Pourriez-vous m\'envoyer une capture d\'écran du problème ? Cela m\'aidera à comprendre et résoudre votre situation plus rapidement.' },
      { label: '🔄 Transfert', content: 'Je vais transférer votre demande à un collègue spécialisé qui pourra mieux vous aider. Vous serez recontacté(e) sous peu.' },
    ],
  },
  {
    category: 'Crédits & Paiements',
    emoji: '💳',
    replies: [
      { label: '💳 Crédits ajoutés', content: 'Les crédits ont été ajoutés à votre compte. Vous pouvez vérifier votre solde dans la section Crédits.' },
      { label: '💰 Solde vérification', content: 'Je viens de vérifier votre solde de crédits. Vous pouvez le consulter à tout moment en allant dans votre profil → Crédits.' },
      { label: '🎁 Crédits gratuits', content: 'Vous pouvez obtenir des crédits gratuits de plusieurs manières :\n- Connexion quotidienne\n- Parrainage d\'amis\n- Complétion de votre profil\n- Vérification d\'identité\nConsultez la page Crédits pour plus de détails !' },
      { label: '💳 Achat crédits', content: 'Pour acheter des crédits, rendez-vous dans la section Crédits de votre profil. Vous y trouverez les différentes offres disponibles. Le paiement est sécurisé et les crédits sont ajoutés instantanément.' },
      { label: '⚡ Recharge passive', content: 'La recharge passive vous permet de gagner des crédits automatiquement toutes les quelques heures, jusqu\'à un plafond. C\'est entièrement gratuit et automatique !' },
      { label: '🔄 Remboursement', content: 'Votre demande de remboursement a bien été prise en compte. Les crédits ont été recrédités sur votre compte. Vous pouvez vérifier votre solde dans la section Crédits.' },
      { label: '❌ Refus remboursement', content: 'Après vérification, votre demande de remboursement ne peut malheureusement pas être acceptée car les crédits ont été utilisés conformément aux conditions d\'utilisation. Je reste disponible pour toute question.' },
      { label: '💎 Explication tarifs', content: 'Chaque action sur GaySocial a un coût en crédits qui peut varier. Par exemple, envoyer un message, voir un profil, ou partager un album. Vous pouvez consulter tous les tarifs dans la section Crédits → Tarifs.' },
    ],
  },
  {
    category: 'Compte & Profil',
    emoji: '👤',
    replies: [
      { label: '🔐 Mot de passe', content: 'Pour réinitialiser votre mot de passe, cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé à l\'adresse associée à votre compte.' },
      { label: '📧 Changement email', content: 'Pour modifier votre adresse email, rendez-vous dans les paramètres de votre compte. Vous recevrez un email de confirmation sur la nouvelle adresse.' },
      { label: '📝 Compléter profil', content: 'Pour compléter votre profil, allez dans Profil → Modifier. Ajoutez une photo, une description et vos centres d\'intérêt. Un profil complet augmente votre visibilité et vous rapporte des crédits bonus !' },
      { label: '📷 Photo refusée', content: 'Votre photo de profil a été refusée car elle ne respecte pas nos règles. Assurez-vous que la photo :\n- Montre clairement votre visage\n- Ne contient pas de contenu inapproprié\n- Est de bonne qualité\n- Ne contient pas de texte ou logos' },
      { label: '📷 Photo approuvée', content: 'Bonne nouvelle ! Votre photo de profil a été approuvée et est maintenant visible publiquement. 🎉' },
      { label: '🗑️ Suppression compte', content: 'Pour supprimer votre compte, rendez-vous dans Paramètres → Compte → Supprimer mon compte. Attention, cette action est irréversible et toutes vos données seront supprimées après un délai de rétention.' },
      { label: '🔒 Compte suspendu', content: 'Votre compte a été temporairement suspendu suite à un signalement. Une enquête est en cours. Vous serez informé(e) de la décision finale par email.' },
      { label: '🔓 Compte réactivé', content: 'Votre compte a été réactivé ! Vous pouvez à nouveau vous connecter et utiliser toutes les fonctionnalités de GaySocial. Nous vous rappelons l\'importance de respecter les règles de la communauté.' },
    ],
  },
  {
    category: 'Vérification & Sécurité',
    emoji: '🔒',
    replies: [
      { label: '🔒 Vérification', content: 'Pour des raisons de sécurité, pourriez-vous me donner plus de détails sur votre demande ?' },
      { label: '🪪 Vérif. identité', content: 'La vérification d\'identité permet de certifier votre profil avec un badge vérifié. Pour cela :\n1. Allez dans Paramètres → Vérification\n2. Prenez une photo de votre pièce d\'identité (recto/verso)\n3. Prenez un selfie\nVos documents sont traités de manière confidentielle et supprimés après vérification.' },
      { label: '✅ Identité vérifiée', content: 'Votre identité a été vérifiée avec succès ! Votre profil affiche maintenant un badge de vérification. Vous avez également reçu vos crédits de récompense. 🎉' },
      { label: '❌ Vérif. refusée', content: 'Votre demande de vérification d\'identité a été refusée. Raison : les documents fournis ne sont pas lisibles ou ne correspondent pas. Vous pouvez soumettre une nouvelle demande avec des documents plus clairs.' },
      { label: '🛡️ Sécurité compte', content: 'Pour protéger votre compte :\n- Utilisez un mot de passe fort et unique\n- Ne partagez jamais vos identifiants\n- Déconnectez-vous sur les appareils partagés\n- Signalez tout comportement suspect' },
      { label: '⚠️ Activité suspecte', content: 'Nous avons détecté une activité inhabituelle sur votre compte. Par mesure de sécurité, nous vous recommandons de changer votre mot de passe immédiatement.' },
    ],
  },
  {
    category: 'Signalements & Modération',
    emoji: '🚫',
    replies: [
      { label: '🚫 Signalement traité', content: 'Le signalement a bien été pris en compte et des mesures appropriées ont été prises. Merci de contribuer à la sécurité de la communauté.' },
      { label: '⚠️ Avertissement', content: 'Suite à un signalement, nous vous adressons un avertissement. Le comportement signalé n\'est pas conforme à nos règles. En cas de récidive, des mesures plus strictes pourront être appliquées.' },
      { label: '⚠️ Règles', content: 'Je vous rappelle que le non-respect des règles de la communauté peut entraîner une suspension de votre compte. Merci de votre compréhension.' },
      { label: '🔇 Utilisateur bloqué', content: 'L\'utilisateur que vous avez signalé a été sanctionné. Pour votre tranquillité, vous pouvez également le bloquer depuis son profil pour ne plus voir ses messages.' },
      { label: '📋 Comment signaler', content: 'Pour signaler un utilisateur ou un contenu inapproprié :\n1. Accédez au profil ou au message en question\n2. Cliquez sur les trois points (⋯)\n3. Sélectionnez "Signaler"\n4. Choisissez la raison et ajoutez des détails\nNotre équipe traitera votre signalement rapidement.' },
      { label: '🚨 Contenu supprimé', content: 'Le contenu signalé a été examiné et supprimé car il enfreignait nos règles communautaires. Merci de votre vigilance.' },
      { label: '✅ Signalement non fondé', content: 'Après examen approfondi, le signalement que vous avez soumis ne constitue pas une violation de nos règles. Cependant, vous pouvez bloquer cet utilisateur si vous ne souhaitez plus interagir avec lui.' },
    ],
  },
  {
    category: 'Messagerie & Chat',
    emoji: '💬',
    replies: [
      { label: '💬 Messagerie privée', content: 'La messagerie privée vous permet d\'envoyer des messages textes et médias à d\'autres membres. Chaque message consomme des crédits (le tarif varie selon le type de message).' },
      { label: '📸 Médias éphémères', content: 'Les médias éphémères sont des photos/vidéos qui disparaissent après visionnage. Ils ne peuvent être vus qu\'une seule fois et les captures d\'écran sont détectées et signalées.' },
      { label: '🔔 Notifications', content: 'Pour gérer vos notifications :\n- Allez dans Paramètres → Notifications\n- Activez/désactivez les notifications par type\n- Vous pouvez aussi couper les notifications d\'une conversation spécifique' },
      { label: '👥 Groupes régionaux', content: 'Les groupes de discussion régionaux sont basés sur votre localisation. Vous pouvez rejoindre les groupes de votre région et participer aux conversations. Le coût est identique aux messages privés.' },
      { label: '🔇 Couper conversation', content: 'Vous pouvez couper les notifications d\'une conversation en appuyant longuement dessus dans la liste des messages, puis en sélectionnant "Couper les notifications".' },
    ],
  },
  {
    category: 'Fonctionnalités',
    emoji: '⭐',
    replies: [
      { label: '📍 À proximité', content: 'La fonctionnalité "À proximité" vous permet de découvrir des membres proches de vous. Elle nécessite l\'activation de la géolocalisation et consomme des crédits pour débloquer les résultats.' },
      { label: '💘 Swipe/Rencontres', content: 'La section Rencontres fonctionne comme un système de swipe :\n- Glissez à droite pour liker\n- Glissez à gauche pour passer\n- Si deux personnes se likent, un match est créé !\nChaque action consomme des crédits.' },
      { label: '📸 Albums privés', content: 'Les albums privés vous permettent de stocker vos photos en privé et de les partager sélectivement avec d\'autres membres. La création d\'album et le partage consomment des crédits.' },
      { label: '🤝 Parrainage', content: 'Invitez vos amis grâce à votre code de parrainage ! Quand un filleul s\'inscrit et vérifie son compte, vous recevez tous les deux des crédits bonus. Retrouvez votre code dans la section Crédits.' },
      { label: '💑 Compte couple', content: 'Le mode Couple permet de lier deux comptes pour une expérience partagée. L\'un des partenaires crée le lien et envoie une invitation. Les deux partenaires peuvent ensuite gérer le compte ensemble.' },
      { label: '🚫 Sans pub', content: 'Vous pouvez profiter de GaySocial sans publicités en souscrivant à une offre Sans Pub. Différentes durées sont disponibles et le coût est en crédits. Consultez la section dédiée dans vos paramètres.' },
      { label: '🤖 ChatBot profil', content: 'Vous pouvez configurer un chatbot sur votre profil pour répondre automatiquement aux visiteurs. Allez dans votre profil → ChatBot pour créer votre arbre de réponses personnalisé.' },
    ],
  },
  {
    category: 'Problèmes techniques',
    emoji: '🔧',
    replies: [
      { label: '🔄 Redémarrage', content: 'Essayez de vider le cache de votre navigateur et de vous reconnecter. Si le problème persiste, revenez vers nous.' },
      { label: '🔧 Bug connu', content: 'Ce problème est connu de notre équipe technique et nous travaillons activement à sa résolution. Nous vous informerons dès que le correctif sera déployé. Merci de votre patience.' },
      { label: '📱 App mobile', content: 'GaySocial est une application web progressive (PWA). Pour l\'installer sur votre téléphone :\n- Sur Android : ouvrez Chrome → Menu (⋯) → "Ajouter à l\'écran d\'accueil"\n- Sur iPhone : ouvrez Safari → Partager (↑) → "Sur l\'écran d\'accueil"' },
      { label: '🌐 Navigateur', content: 'Pour une expérience optimale, nous recommandons d\'utiliser la dernière version de Chrome, Firefox, Safari ou Edge. Si vous rencontrez des problèmes, essayez de mettre à jour votre navigateur.' },
      { label: '📷 Erreur upload', content: 'Si vous avez des difficultés à envoyer une photo :\n- Vérifiez que le fichier fait moins de 5 Mo\n- Utilisez un format courant (JPG, PNG)\n- Vérifiez votre connexion internet\n- Essayez de réduire la taille de l\'image' },
      { label: '🔔 Notifications manquantes', content: 'Si vous ne recevez pas les notifications :\n1. Vérifiez que les notifications sont activées dans les paramètres de l\'app\n2. Vérifiez les permissions de votre navigateur/appareil\n3. Assurez-vous que le mode "Ne pas déranger" est désactivé' },
      { label: '✅ Résolu', content: 'Votre problème a été résolu ! N\'hésitez pas à nous recontacter si besoin.' },
    ],
  },
];

interface SavedRepliesSheetProps {
  onSelect: (content: string) => void;
}

const SavedRepliesSheet = ({ onSelect }: SavedRepliesSheetProps) => {
  const { replies, addReply, deleteReply, updateReply } = useModeratorSavedReplies();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIZED_REPLIES;
    const q = search.toLowerCase();
    return CATEGORIZED_REPLIES
      .map(cat => ({
        ...cat,
        replies: cat.replies.filter(
          r => r.label.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.replies.length > 0);
  }, [search]);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addReply.mutate({ content: newContent.trim(), label: newLabel.trim() || undefined });
    setNewLabel('');
    setNewContent('');
    setShowAdd(false);
  };

  const handleSelect = (content: string) => {
    onSelect(content);
    setOpen(false);
  };

  const startEdit = (reply: SavedReply) => {
    setEditingId(reply.id);
    setEditLabel(reply.label || '');
    setEditContent(reply.content);
  };

  const handleUpdate = () => {
    if (!editingId || !editContent.trim()) return;
    updateReply.mutate({ id: editingId, content: editContent.trim(), label: editLabel.trim() || undefined });
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 rounded-full">
          <MessageSquareText className="w-5 h-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            Réponses rapides
            <Badge variant="secondary" className="text-[10px] ml-1">
              {CATEGORIZED_REPLIES.reduce((a, c) => a + c.replies.length, 0)} modèles
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une réponse..."
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 h-[calc(80vh-140px)]">
          <div className="space-y-2 pr-2">
            {/* Categorized quick replies */}
            {filteredCategories.map((cat) => {
              const isOpen = search.trim() ? true : (openCategories[cat.category] ?? false);
              return (
                <Collapsible key={cat.category} open={isOpen} onOpenChange={() => toggleCategory(cat.category)}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="text-xs font-semibold flex-1">{cat.category}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{cat.replies.length}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-3 pt-1 pb-1">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.replies.map((qr, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(qr.content)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card hover:bg-muted transition-colors active:scale-95 text-left"
                          title={qr.content}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {filteredCategories.length === 0 && search.trim() && (
              <p className="text-center text-xs text-muted-foreground py-4">Aucune réponse trouvée pour "{search}"</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mes réponses personnalisées</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Custom saved replies */}
            {replies.length === 0 && !showAdd && (
              <p className="text-center text-xs text-muted-foreground py-3">Aucune réponse personnalisée. Ajoutez-en ci-dessous.</p>
            )}

            {replies.map((reply) => (
              <div key={reply.id} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                {editingId === reply.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Libellé (optionnel)"
                      className="text-xs h-8"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-xs h-7">
                        <X className="w-3 h-3 mr-1" /> Annuler
                      </Button>
                      <Button size="sm" onClick={handleUpdate} className="text-xs h-7" disabled={updateReply.isPending}>
                        <Check className="w-3 h-3 mr-1" /> Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {reply.label && (
                          <Badge variant="secondary" className="text-[10px] mb-1">{reply.label}</Badge>
                        )}
                        <p className="text-sm text-foreground line-clamp-3">{reply.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(reply)}>
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteReply.mutate(reply.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-7 mt-1"
                      onClick={() => handleSelect(reply.content)}
                    >
                      Utiliser cette réponse
                    </Button>
                  </>
                )}
              </div>
            ))}

            {/* Add new reply form */}
            {showAdd ? (
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Libellé (ex: Salutation, Clôture...)"
                  className="text-xs h-8"
                />
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Contenu de la réponse..."
                  className="text-sm min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewContent(''); setNewLabel(''); }} className="text-xs h-7">
                    <X className="w-3 h-3 mr-1" /> Annuler
                  </Button>
                  <Button size="sm" onClick={handleAdd} className="text-xs h-7" disabled={!newContent.trim() || addReply.isPending}>
                    <Plus className="w-3 h-3 mr-1" /> Ajouter
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed text-xs h-9"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nouvelle réponse personnalisée
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SavedRepliesSheet;
