import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Flame, Trash2, Clock, Calendar, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Promotion {
  id: string;
  label: string;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

const CreditPromotionsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: '',
    description: '',
    discount_percent: 20,
    starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    ends_at: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['credit-promotions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_promotions' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Promotion[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from('credit_promotions' as any).insert({
        label: payload.label,
        description: payload.description || null,
        discount_percent: payload.discount_percent,
        starts_at: new Date(payload.starts_at).toISOString(),
        ends_at: new Date(payload.ends_at).toISOString(),
        created_by: user?.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Promotion créée 🎉');
      queryClient.invalidateQueries({ queryKey: ['credit-promotions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-credit-promotion'] });
      setOpen(false);
      setForm({
        label: '',
        description: '',
        discount_percent: 20,
        starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        ends_at: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('credit_promotions' as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-promotions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-credit-promotion'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_promotions' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Promotion supprimée');
      queryClient.invalidateQueries({ queryKey: ['credit-promotions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-credit-promotion'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPromoActive = (p: Promotion) => {
    const now = Date.now();
    return p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() > now;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <CardTitle>Promotions sur les crédits</CardTitle>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nouvelle promo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Créer une promotion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Libellé</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex: Promo de Noël"
                />
              </div>
              <div>
                <Label>Description (optionnelle)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Détails de la promotion"
                  rows={2}
                />
              </div>
              <div>
                <Label>Pourcentage de réduction (1-100%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm({ ...form, discount_percent: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Début</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.label || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !promotions || promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune promotion créée
          </div>
        ) : (
          <div className="space-y-2">
            {promotions.map((p) => {
              const active = isPromoActive(p);
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    active ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{p.label}</span>
                      <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
                        {active ? '🔥 Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                        -{p.discount_percent}%
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(p.starts_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(p.ends_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: p.id, is_active: checked })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Supprimer cette promotion ?')) deleteMutation.mutate(p.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditPromotionsPanel;
