import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BanIcon, Plus, Pencil, Trash2, Star, Loader2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdFreePlan {
  id: string;
  label: string;
  duration_days: number;
  credits_cost: number;
  tag: string | null;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

const AdFreePlansPanel = () => {
  const queryClient = useQueryClient();
  const [editPlan, setEditPlan] = useState<AdFreePlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ label: '', duration_days: 7, credits_cost: 7, tag: '', is_popular: false, display_order: 0 });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['ad-free-plans-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_free_plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as AdFreePlan[];
    },
  });

  const openCreate = () => {
    setEditPlan(null);
    setForm({ label: '', duration_days: 7, credits_cost: 7, tag: '', is_popular: false, display_order: (plans?.length || 0) + 1 });
    setShowForm(true);
  };

  const openEdit = (plan: AdFreePlan) => {
    setEditPlan(plan);
    setForm({ label: plan.label, duration_days: plan.duration_days, credits_cost: plan.credits_cost, tag: plan.tag || '', is_popular: plan.is_popular, display_order: plan.display_order });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.duration_days || !form.credits_cost) {
      toast.error('Remplis tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label,
        duration_days: form.duration_days,
        credits_cost: form.credits_cost,
        tag: form.tag || null,
        is_popular: form.is_popular,
        display_order: form.display_order,
      };

      if (editPlan) {
        const { error } = await supabase.from('ad_free_plans').update(payload).eq('id', editPlan.id);
        if (error) throw error;
        toast.success('Offre modifiée');
      } else {
        const { error } = await supabase.from('ad_free_plans').insert(payload);
        if (error) throw error;
        toast.success('Offre créée');
      }
      queryClient.invalidateQueries({ queryKey: ['ad-free-plans-admin'] });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: AdFreePlan) => {
    const { error } = await supabase.from('ad_free_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    if (error) { toast.error(error.message); return; }
    toast.success(plan.is_active ? 'Offre désactivée' : 'Offre activée');
    queryClient.invalidateQueries({ queryKey: ['ad-free-plans-admin'] });
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return;
    const { error } = await supabase.from('ad_free_plans').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Offre supprimée');
    queryClient.invalidateQueries({ queryKey: ['ad-free-plans-admin'] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BanIcon className="w-4 h-4 text-primary" />
          Offres Sans Pub
        </CardTitle>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !plans?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune offre configurée</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className={`flex items-center gap-3 p-3 rounded-lg border ${plan.is_active ? 'border-border bg-card' : 'border-border/40 bg-muted/30 opacity-60'}`}>
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{plan.label}</span>
                  {plan.is_popular && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                  {plan.tag && <Badge variant="secondary" className="text-[10px]">{plan.tag}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{plan.credits_cost} crédits · {plan.duration_days} jours</p>
              </div>
              <Switch checked={plan.is_active} onCheckedChange={() => toggleActive(plan)} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(plan)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlan(plan.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Modifier l\'offre' : 'Nouvelle offre sans pub'}</DialogTitle>
            <DialogDescription>Configurez la durée et le prix en crédits.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: 7 jours" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Durée (jours)</Label>
                <Input type="number" min={1} value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Coût (crédits)</Label>
                <Input type="number" min={1} value={form.credits_cost} onChange={e => setForm(f => ({ ...f, credits_cost: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tag (optionnel)</Label>
                <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Ex: Populaire" />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
              <Label>Mise en avant (populaire)</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editPlan ? 'Enregistrer' : 'Créer l\'offre'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdFreePlansPanel;
