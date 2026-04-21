/**
 * Panel admin — Barème de crédits du ChatBot Personnel.
 *
 * Permet d'éditer :
 *  - Le coût total cumulé pour N blocs (N = 1, 2, 3, …)
 *  - Le surcoût appliqué au-delà du dernier palier (ex. +30 par bloc)
 *  - Ajout / suppression d'un palier
 *
 * Le barème est appliqué automatiquement lors de la création d'un bloc
 * via la RPC `compute_chatbot_node_cost(_count)` côté DB.
 */
import { useMemo, useState } from 'react';
import {
  Bot, Save, Loader2, Plus, Trash2, TrendingUp, Coins, Info, Check, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useChatbotPricing,
  useUpdateChatbotPricingTier,
  useAddChatbotPricingTier,
  useDeleteChatbotPricingTier,
  type ChatbotPricingTier,
} from '@/hooks/useChatbotPricing';
import { cn } from '@/lib/utils';

const ChatbotPricingPanel = () => {
  const { data: tiers = [], isLoading } = useChatbotPricing();
  const updateTier = useUpdateChatbotPricingTier();
  const addTier = useAddChatbotPricingTier();
  const deleteTier = useDeleteChatbotPricingTier();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<string>('');
  const [editExtra, setEditExtra] = useState<string>('');
  const [newCount, setNewCount] = useState<string>('');
  const [newCost, setNewCost] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<ChatbotPricingTier | null>(null);

  const lastTier = tiers[tiers.length - 1];
  const maxCount = lastTier?.node_count ?? 0;

  // Aperçu : coût pour quelques nombres de blocs représentatifs
  const previewCounts = useMemo(() => {
    const base = tiers.map(t => t.node_count);
    const extras = [maxCount + 1, maxCount + 5, maxCount + 10].filter(n => n > 0);
    return [...base, ...extras];
  }, [tiers, maxCount]);

  const computePreview = (count: number): number => {
    const exact = tiers.find(t => t.node_count === count);
    if (exact) return exact.total_cost;
    if (!lastTier) return 0;
    const extra = lastTier.extra_cost_per_node || 30;
    return lastTier.total_cost + Math.max(0, count - lastTier.node_count) * extra;
  };

  const startEdit = (tier: ChatbotPricingTier) => {
    setEditingId(tier.id);
    setEditCost(String(tier.total_cost));
    setEditExtra(String(tier.extra_cost_per_node));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCost('');
    setEditExtra('');
  };

  const saveEdit = (tier: ChatbotPricingTier) => {
    const cost = parseInt(editCost, 10);
    const extra = parseInt(editExtra, 10);
    if (isNaN(cost) || cost < 0) return;
    updateTier.mutate(
      { id: tier.id, total_cost: cost, extra_cost_per_node: isNaN(extra) ? 0 : extra },
      { onSuccess: cancelEdit },
    );
  };

  const handleAdd = () => {
    const count = parseInt(newCount, 10);
    const cost = parseInt(newCost, 10);
    if (isNaN(count) || count <= 0 || isNaN(cost) || cost < 0) return;
    if (tiers.some(t => t.node_count === count)) return;
    addTier.mutate({ node_count: count, total_cost: cost }, {
      onSuccess: () => { setNewCount(''); setNewCost(''); },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Barème ChatBot Personnel</h2>
        </div>
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">Barème ChatBot Personnel</h2>
              <p className="text-xs text-muted-foreground">
                Coût en crédits selon le nombre de blocs créés par l'utilisateur
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Coins className="w-3 h-3" /> {tiers.length} palier{tiers.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Note explicative */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 flex gap-2 items-start">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            Le coût est <strong>cumulatif</strong> : la valeur saisie est le total à payer pour atteindre
            ce nombre de blocs. Le surcoût (dernière colonne) ne s'applique qu'à la <strong>dernière ligne</strong>
            et définit le prix de chaque bloc supplémentaire au-delà du dernier palier.
            Tous les changements sont appliqués <strong>immédiatement</strong> au prochain achat.
          </div>
        </CardContent>
      </Card>

      {/* Table des paliers */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/30 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Blocs</div>
            <div>Coût total</div>
            <div>+1 bloc au-delà</div>
            <div className="text-right">Actions</div>
          </div>

          {tiers.map((tier, idx) => {
            const isLast = idx === tiers.length - 1;
            const prevCost = idx > 0 ? tiers[idx - 1].total_cost : 0;
            const delta = tier.total_cost - prevCost;
            const isEditing = editingId === tier.id;

            return (
              <div
                key={tier.id}
                className={cn(
                  'grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-3 py-2.5 items-center border-b last:border-b-0 transition-colors',
                  isEditing ? 'bg-primary/5' : 'hover:bg-muted/20',
                )}
              >
                {/* Nb blocs */}
                <div className="font-bold tabular-nums text-sm">
                  {tier.node_count}
                  {isLast && <span className="text-[10px] text-primary ml-0.5">+</span>}
                </div>

                {/* Coût total */}
                <div>
                  {isEditing ? (
                    <Input
                      type="number"
                      min={0}
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-semibold tabular-nums">{tier.total_cost}</span>
                      <span className="text-[10px] text-muted-foreground">crédits</span>
                      {delta > 0 && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-1">
                          +{delta}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Surcoût (uniquement éditable sur la dernière ligne, c'est elle qui sert de référence) */}
                <div>
                  {isEditing && isLast ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={editExtra}
                        onChange={(e) => setEditExtra(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <span className="text-[10px] text-muted-foreground">/bloc</span>
                    </div>
                  ) : isLast ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold tabular-nums">+{tier.extra_cost_per_node}</span>
                      <span className="text-[10px] text-muted-foreground">par bloc sup.</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  {isEditing ? (
                    <>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7"
                        onClick={cancelEdit}
                        disabled={updateTier.isPending}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => saveEdit(tier)}
                        disabled={updateTier.isPending}
                      >
                        {updateTier.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => startEdit(tier)}
                      >
                        <Save className="w-3 h-3 mr-1" /> Éditer
                      </Button>
                      {tiers.length > 1 && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => setConfirmDelete(tier)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Ajout d'un palier */}
          <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-3 py-2.5 items-center bg-muted/20 border-t">
            <Input
              type="number"
              min={1}
              placeholder="N"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder="Coût total"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-[11px] text-muted-foreground">
              (modifiable après création)
            </span>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAdd}
              disabled={addTier.isPending || !newCount || !newCost}
            >
              {addTier.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Plus className="w-3.5 h-3.5 mr-1" />}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu en temps réel */}
      <Card>
        <CardContent className="p-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Simulation du coût total
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {previewCounts.map(n => (
              <div
                key={n}
                className={cn(
                  'rounded-lg border p-2 text-center',
                  n > maxCount ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-secondary/20',
                )}
              >
                <div className="text-[10px] text-muted-foreground">
                  {n} bloc{n > 1 ? 's' : ''}{n > maxCount && ' ★'}
                </div>
                <div className="text-sm font-bold tabular-nums">{computePreview(n)}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            ★ = extrapolé via le surcoût « +{lastTier?.extra_cost_per_node ?? 30} par bloc supplémentaire »
          </p>
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le palier {confirmDelete?.node_count} blocs ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le coût pour ce nombre de blocs sera désormais extrapolé depuis le dernier palier.
              Cette action est immédiate et irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) deleteTier.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatbotPricingPanel;
