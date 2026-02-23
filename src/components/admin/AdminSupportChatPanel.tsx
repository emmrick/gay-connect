import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveTask } from '@/hooks/useModerationTaskQueue';
import SupportChatRoom from '@/components/support/SupportChatRoom';
import { SupportTicket } from '@/hooks/useSupportTickets';
import { Headphones, Loader2 } from 'lucide-react';

interface AdminSupportChatPanelProps {
  onBack: () => void;
}

const AdminSupportChatPanel = ({ onBack }: AdminSupportChatPanelProps) => {
  const { data: activeTask } = useActiveTask();
  const ticketId = (activeTask?.metadata as any)?.ticket_id as string | undefined;

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket-detail', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .select('*')
        .eq('id', ticketId)
        .single();
      if (error) throw error;
      return data as unknown as SupportTicket;
    },
    enabled: !!ticketId,
  });

  // Auto-assign ticket when moderator opens it
  useEffect(() => {
    if (ticket && ticket.status === 'open' && activeTask?.reserved_by) {
      supabase
        .from('support_tickets' as any)
        .update({ status: 'assigned', assigned_to: activeTask.reserved_by } as any)
        .eq('id', ticket.id)
        .then();
    }
  }, [ticket?.id, ticket?.status, activeTask?.reserved_by]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Headphones className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">Aucun ticket de support actif</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Acceptez une mission de support depuis la file d'attente pour ouvrir une conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] -m-4 sm:-m-6">
      <SupportChatRoom ticket={ticket} onBack={onBack} />
    </div>
  );
};

export default AdminSupportChatPanel;
