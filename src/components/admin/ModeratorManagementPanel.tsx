import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield, Search, UserPlus, Trash2, Loader2, Users,
  Filter, IdCard, Coins, MessageSquare, BarChart3, Ban,
  History, Ticket, Bell, Bot, Camera, HelpCircle, FileImage, Activity, Megaphone
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

interface ModeratorPermissions {
  can_manage_reports: boolean;
  can_manage_users: boolean;
  can_manage_credits: boolean;
  can_verify_identity: boolean;
  can_manage_content: boolean;
  can_view_stats: boolean;
  can_manage_blocked: boolean;
  can_view_history: boolean;
  can_manage_promo: boolean;
  can_broadcast: boolean;
  can_ai_moderation: boolean;
  can_screenshot_sanctions: boolean;
  can_manage_faq: boolean;
  can_manage_popups: boolean;
  can_view_logs: boolean;
  can_manage_flyers: boolean;
}

const PERMISSION_LABELS: Record<keyof ModeratorPermissions, { label: string; icon: React.ElementType }> = {
  can_manage_reports: { label: 'Signalements', icon: Filter },
  can_manage_users: { label: 'Utilisateurs', icon: Users },
  can_manage_credits: { label: 'Crédits', icon: Coins },
  can_verify_identity: { label: 'Vérification identité', icon: IdCard },
  can_manage_content: { label: 'Contenu', icon: MessageSquare },
  can_view_stats: { label: 'Statistiques', icon: BarChart3 },
  can_manage_blocked: { label: 'Utilisateurs bloqués', icon: Ban },
  can_view_history: { label: 'Historique', icon: History },
  can_manage_promo: { label: 'Codes promo', icon: Ticket },
  can_broadcast: { label: 'Notifications', icon: Bell },
  can_ai_moderation: { label: 'Modération IA', icon: Bot },
  can_screenshot_sanctions: { label: 'Captures écran', icon: Camera },
  can_manage_faq: { label: 'FAQ & Aide', icon: HelpCircle },
  can_manage_popups: { label: 'Pop-ups', icon: Megaphone },
  can_view_logs: { label: 'Logs & Sécurité', icon: Activity },
  can_manage_flyers: { label: 'Flyers', icon: FileImage },
};

const DEFAULT_PERMISSIONS: ModeratorPermissions = {
  can_manage_reports: true,
  can_manage_users: true,
  can_manage_credits: false,
  can_verify_identity: true,
  can_manage_content: true,
  can_view_stats: true,
  can_manage_blocked: true,
  can_view_history: true,
  can_manage_promo: false,
  can_broadcast: false,
  can_ai_moderation: false,
  can_screenshot_sanctions: false,
  can_manage_faq: false,
  can_manage_popups: false,
  can_view_logs: false,
  can_manage_flyers: false,
};

const ModeratorManagementPanel = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMod, setSelectedMod] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [newPermissions, setNewPermissions] = useState<ModeratorPermissions>(DEFAULT_PERMISSIONS);

  // Fetch moderators with their permissions
  const { data: moderators = [], isLoading } = useQuery({
    queryKey: ['moderators-list'],
    queryFn: async () => {
      // Get all users with moderator role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'moderator');

      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      const userIds = roles.map(r => r.user_id);

      // Get profiles and permissions in parallel
      const [profilesResult, permissionsResult] = await Promise.all([
        supabase.from('profiles').select('user_id, username, avatar_url, region, age').in('user_id', userIds),
        supabase.from('moderator_permissions' as any).select('*').in('user_id', userIds),
      ]);

      return roles.map(role => {
        const profile = profilesResult.data?.find(p => p.user_id === role.user_id);
        const perms = (permissionsResult.data as any[])?.find((p: any) => p.user_id === role.user_id);
        return { ...role, profile, permissions: perms };
      });
    },
  });

  // Search users for adding as moderator
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-users-for-mod', userSearch],
    queryFn: async () => {
      if (userSearch.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, region, age')
        .ilike('username', `%${userSearch}%`)
        .limit(10);
      return data || [];
    },
    enabled: userSearch.length >= 2,
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: ModeratorPermissions }) => {
      const { data, error } = await supabase.rpc('promote_to_moderator', {
        _target_user_id: userId,
        _permissions: permissions as any,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderators-list'] });
      toast.success('Modérateur ajouté avec succès');
      setAddDialogOpen(false);
      setUserSearch('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('demote_moderator', {
        _target_user_id: userId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderators-list'] });
      toast.success('Modérateur retiré');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePermsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: ModeratorPermissions }) => {
      const { data, error } = await supabase.rpc('promote_to_moderator', {
        _target_user_id: userId,
        _permissions: permissions as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderators-list'] });
      toast.success('Permissions mises à jour');
      setEditDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredMods = moderators.filter((m: any) =>
    !search || m.profile?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const PermissionToggles = ({ 
    perms, onChange 
  }: { 
    perms: ModeratorPermissions; 
    onChange: (key: keyof ModeratorPermissions, val: boolean) => void;
  }) => (
    <div className="space-y-2">
      {(Object.keys(PERMISSION_LABELS) as (keyof ModeratorPermissions)[]).map(key => {
        const { label, icon: Icon } = PERMISSION_LABELS[key];
        return (
          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </div>
            <Switch checked={perms[key]} onCheckedChange={(v) => onChange(key, v)} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Modérateurs ({moderators.length})</h2>
        </div>
        <Button size="sm" onClick={() => { setNewPermissions(DEFAULT_PERMISSIONS); setAddDialogOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un modérateur..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : filteredMods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun modérateur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMods.map((mod: any) => {
              const perms = mod.permissions;
              const activePerms = perms 
                ? (Object.keys(PERMISSION_LABELS) as (keyof ModeratorPermissions)[]).filter(k => perms[k])
                : [];

              return (
                <Card key={mod.user_id} className="bg-card/80 border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{mod.profile?.username || 'Inconnu'}</p>
                          <p className="text-xs text-muted-foreground">{mod.profile?.region} • {mod.profile?.age} ans</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            setSelectedMod(mod);
                            setNewPermissions({
                              can_manage_reports: perms?.can_manage_reports || false,
                              can_manage_users: perms?.can_manage_users || false,
                              can_manage_credits: perms?.can_manage_credits || false,
                              can_verify_identity: perms?.can_verify_identity || false,
                              can_manage_content: perms?.can_manage_content || false,
                              can_view_stats: perms?.can_view_stats || false,
                              can_manage_blocked: perms?.can_manage_blocked || false,
                              can_view_history: perms?.can_view_history || false,
                              can_manage_promo: perms?.can_manage_promo || false,
                              can_broadcast: perms?.can_broadcast || false,
                              can_ai_moderation: perms?.can_ai_moderation || false,
                              can_screenshot_sanctions: perms?.can_screenshot_sanctions || false,
                              can_manage_faq: perms?.can_manage_faq || false,
                              can_manage_popups: perms?.can_manage_popups || false,
                              can_view_logs: perms?.can_view_logs || false,
                              can_manage_flyers: perms?.can_manage_flyers || false,
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7"
                          onClick={() => {
                            if (confirm(`Retirer ${mod.profile?.username} des modérateurs ?`)) {
                              demoteMutation.mutate(mod.user_id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activePerms.map(key => (
                        <Badge key={key} variant="secondary" className="text-[10px]">
                          {PERMISSION_LABELS[key].label}
                        </Badge>
                      ))}
                      {activePerms.length === 0 && (
                        <span className="text-xs text-muted-foreground">Aucune permission</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add Moderator Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Ajouter un modérateur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par pseudo..."
                className="pl-9 text-sm"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((user: any) => (
                  <button
                    key={user.user_id}
                    onClick={() => {
                      setSelectedMod(user);
                      setUserSearch(user.username);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                      selectedMod?.user_id === user.user_id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.region}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Permissions :</p>
              <PermissionToggles
                perms={newPermissions}
                onChange={(key, val) => setNewPermissions(prev => ({ ...prev, [key]: val }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Annuler</Button>
            <Button
              disabled={!selectedMod?.user_id || promoteMutation.isPending}
              onClick={() => {
                if (selectedMod?.user_id) {
                  promoteMutation.mutate({ userId: selectedMod.user_id, permissions: newPermissions });
                }
              }}
            >
              {promoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissions de {selectedMod?.profile?.username || selectedMod?.username}
            </DialogTitle>
          </DialogHeader>

          <PermissionToggles
            perms={newPermissions}
            onChange={(key, val) => setNewPermissions(prev => ({ ...prev, [key]: val }))}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button
              disabled={updatePermsMutation.isPending}
              onClick={() => {
                const userId = selectedMod?.user_id || selectedMod?.profile?.user_id;
                if (userId) {
                  updatePermsMutation.mutate({ userId, permissions: newPermissions });
                }
              }}
            >
              {updatePermsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModeratorManagementPanel;
