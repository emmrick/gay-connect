import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Camera, Trash2, Loader2, Save, Search, Shield, ShieldCheck, UserMinus, Crown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCustomGroups } from '@/hooks/useCustomGroups';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentName: string;
  currentDescription?: string | null;
  currentAvatarUrl?: string | null;
  onGroupDeleted?: () => void;
}

const GroupSettingsDialog = ({
  open,
  onOpenChange,
  roomId,
  currentName,
  currentDescription,
  currentAvatarUrl,
  onGroupDeleted,
}: GroupSettingsDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { removeMember, updateMemberRole } = useCustomGroups();
  
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [kickConfirm, setKickConfirm] = useState<{ userId: string; username: string } | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setDescription(currentDescription || '');
      setAvatarUrl(currentAvatarUrl || '');
      setMemberSearch('');
    }
  }, [open, currentName, currentDescription, currentAvatarUrl]);

  // Fetch members with their roles
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['group-settings-members', roomId],
    queryFn: async () => {
      const { data: memberRows } = await supabase
        .from('chat_room_members')
        .select('user_id, role, joined_at')
        .eq('chat_room_id', roomId);

      if (!memberRows?.length) return [];

      const userIds = memberRows.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return memberRows.map(m => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        username: profileMap.get(m.user_id)?.username || 'Inconnu',
        avatarUrl: profileMap.get(m.user_id)?.avatar_url,
      }));
    },
    enabled: open && !!roomId,
  });

  // Check if current user is admin
  const isAdmin = members.some(m => m.userId === user?.id && m.role === 'admin');

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${roomId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-avatars')
        .getPublicUrl(path);

      setAvatarUrl(publicUrl);
      toast.success('Photo uploadée !');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          custom_name: name.trim(),
          region_name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', roomId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['custom-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-room', roomId] });
      toast.success('Groupe mis à jour !');
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await supabase.from('chat_room_members').delete().eq('chat_room_id', roomId);
      await supabase.from('messages').delete().eq('chat_room_id', roomId);
      const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['custom-groups'] });
      toast.success('Groupe supprimé');
      onOpenChange(false);
      onGroupDeleted?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateMemberRole.mutate({ groupId: roomId, userId, role: newRole }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['group-settings-members', roomId] });
      }
    });
  };

  const handleKick = () => {
    if (!kickConfirm) return;
    removeMember.mutate({ groupId: roomId, userId: kickConfirm.userId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['group-settings-members', roomId] });
        setKickConfirm(null);
      }
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]"><Crown className="w-3 h-3 mr-0.5" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]"><ShieldCheck className="w-3 h-3 mr-0.5" />Modérateur</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Paramètres du groupe
            </DialogTitle>
            <DialogDescription>
              Gère les informations et les membres de ton groupe
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Infos</TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Membres ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden group"
                    disabled={isUploading}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-xs text-muted-foreground">Clique pour changer la photo</p>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Nom du groupe *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    className="bg-secondary/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="bg-secondary/50 resize-none"
                    placeholder="Décris ton groupe..."
                  />
                </div>

                {/* Save */}
                <Button
                  className="w-full"
                  disabled={!name.trim() || isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>

                {/* Delete */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le groupe
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="flex-1 min-h-0 flex flex-col mt-4">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>

              <ScrollArea className="flex-1 max-h-[40vh]">
                <div className="space-y-1.5 pr-2">
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun membre trouvé
                    </p>
                  ) : (
                    filteredMembers.map((member) => (
                      <div key={member.userId} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                          ) : (
                            member.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-foreground truncate">{member.username}</span>
                            {getRoleBadge(member.role)}
                            {member.userId === user?.id && (
                              <span className="text-[10px] text-muted-foreground">(toi)</span>
                            )}
                          </div>
                        </div>

                        {/* Admin actions */}
                        {isAdmin && member.userId !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <Shield className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role !== 'admin' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'admin')}>
                                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                                  Promouvoir Admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'moderator' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'moderator')}>
                                  <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                                  Promouvoir Modérateur
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'member' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'member')}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Rétrograder Membre
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setKickConfirm({ userId: member.userId, username: member.username })}
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Expulser
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages et membres seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick confirmation */}
      <AlertDialog open={!!kickConfirm} onOpenChange={() => setKickConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expulser {kickConfirm?.username} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce membre sera retiré du groupe et ne pourra plus voir les messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Expulser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupSettingsDialog;
