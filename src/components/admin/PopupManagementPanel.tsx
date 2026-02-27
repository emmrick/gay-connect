import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AdminPopup {
  id: string;
  title: string;
  message: string;
  popup_type: string;
  is_active: boolean;
  icon: string;
  button_text: string;
  button_action: string | null;
  created_at: string;
}

const PopupManagementPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<AdminPopup | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    popup_type: 'promotion',
    icon: 'gift',
    button_text: 'OK',
    button_action: '',
  });

  const { data: popups, isLoading } = useQuery({
    queryKey: ['admin-popups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_popups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AdminPopup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (popup: typeof form) => {
      const { error } = await supabase.from('admin_popups').insert({
        ...popup,
        button_action: popup.button_action || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
      toast.success('Pop-up créé');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof form) => {
      const { error } = await supabase.from('admin_popups').update({
        ...data,
        button_action: data.button_action || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
      toast.success('Pop-up modifié');
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('admin_popups').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_popups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
      toast.success('Pop-up supprimé');
    },
  });

  const resetForm = () => {
    setForm({ title: '', message: '', popup_type: 'promotion', icon: 'gift', button_text: 'OK', button_action: '' });
    setEditingPopup(null);
    setDialogOpen(false);
  };

  const openEdit = (popup: AdminPopup) => {
    setEditingPopup(popup);
    setForm({
      title: popup.title,
      message: popup.message,
      popup_type: popup.popup_type,
      icon: popup.icon,
      button_text: popup.button_text,
      button_action: popup.button_action || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.message) return toast.error('Titre et message requis');
    if (editingPopup) {
      updateMutation.mutate({ id: editingPopup.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Pop-ups promotionnels</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPopup ? 'Modifier le pop-up' : 'Nouveau pop-up'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Invite tes amis !" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Contenu du pop-up..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Icône</Label>
                  <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gift">🎁 Cadeau</SelectItem>
                      <SelectItem value="megaphone">📢 Annonce</SelectItem>
                      <SelectItem value="sparkles">✨ Nouveauté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.popup_type} onValueChange={v => setForm(f => ({ ...f, popup_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="announcement">Annonce</SelectItem>
                      <SelectItem value="feature">Nouveauté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Texte du bouton</Label>
                <Input value={form.button_text} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} placeholder="OK" />
              </div>
              <div>
                <Label>Lien (optionnel)</Label>
                <Input value={form.button_action} onChange={e => setForm(f => ({ ...f, button_action: e.target.value }))} placeholder="https://..." />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPopup ? 'Enregistrer' : 'Créer le pop-up'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
          ) : popups?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun pop-up créé</p>
          ) : popups?.map(popup => (
            <Card key={popup.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{popup.title}</h3>
                      <Badge variant={popup.is_active ? 'default' : 'secondary'} className="text-xs">
                        {popup.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{popup.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(popup.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Switch
                      checked={popup.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: popup.id, is_active: checked })}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(popup)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(popup.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PopupManagementPanel;
