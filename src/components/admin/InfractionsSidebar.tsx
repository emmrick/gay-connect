import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface InfractionsSidebarProps {
  userId: string;
  ticketId?: string;
  onClose?: () => void;
}

const InfractionsSidebar = ({ userId, ticketId, onClose }: InfractionsSidebarProps) => {
  const { user: currentUser } = useAuth();

  const { data: infractions = [], refetch } = useQuery({
    queryKey: ['user-infractions-admin', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_infractions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['infraction-user-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const resolveInfractions = async () => {
    if (!currentUser?.id) return;

    const { error } = await supabase
      .from('user_infractions' as any)
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.id,
      } as any)
      .eq('user_id', userId)
      .eq('resolved', false);

    if (error) {
      toast.error('Erreur lors de la résolution');
      return;
    }

    // Close the ticket if linked
    if (ticketId) {
      await supabase
        .from('support_tickets' as any)
        .update({ status: 'closed', closed_at: new Date().toISOString() } as any)
        .eq('id', ticketId);
    }

    toast.success('Infractions résolues, l\'utilisateur peut à nouveau utiliser la plateforme.');
    refetch();
  };

  const unresolvedCount = infractions.filter((i: any) => !i.resolved).length;
  const sanctionedCount = infractions.filter((i: any) => i.is_sanctioned).length;

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-destructive/5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-sm">Infractions</h3>
          <Badge variant="destructive" className="text-[10px] h-5">
            {infractions.length}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* User summary */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold">{userProfile?.username || 'Utilisateur'}</p>
        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
          <span>Total: {infractions.length}</span>
          <span>Non résolues: {unresolvedCount}</span>
          <span>Sanctions: {sanctionedCount}</span>
        </div>
      </div>

      {/* Infractions list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {infractions.map((infraction: any) => (
            <div
              key={infraction.id}
              className={`rounded-xl p-3 border text-xs ${
                infraction.resolved
                  ? 'bg-muted/30 border-border'
                  : infraction.is_sanctioned
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {infraction.resolved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : infraction.is_sanctioned ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="font-semibold">
                    Avertissement #{infraction.warning_number}
                  </span>
                </div>
                {infraction.is_sanctioned && !infraction.resolved && (
                  <Badge variant="destructive" className="text-[9px] h-4">Sanction</Badge>
                )}
                {infraction.resolved && (
                  <Badge variant="secondary" className="text-[9px] h-4">Résolu</Badge>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground">
                  <strong>Mot détecté :</strong>{' '}
                  <span className="text-destructive font-mono">"{infraction.detected_word}"</span>
                </p>
                <p className="text-muted-foreground line-clamp-2">
                  <strong>Message :</strong> {infraction.message_content}
                </p>
                <p className="text-muted-foreground/70">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {format(new Date(infraction.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
                {infraction.resolved_at && (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    Résolu le {format(new Date(infraction.resolved_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          ))}

          {infractions.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-8">Aucune infraction</p>
          )}
        </div>
      </ScrollArea>

      {/* Resolve button */}
      {unresolvedCount > 0 && (
        <div className="p-3 border-t border-border">
          <Button
            onClick={resolveInfractions}
            className="w-full"
            variant="default"
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Résoudre et débloquer l'utilisateur
          </Button>
        </div>
      )}
    </div>
  );
};

export default InfractionsSidebar;
