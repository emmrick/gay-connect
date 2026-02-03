import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AIReport {
  id: string;
  report_id: string | null;
  reported_user_id: string;
  ai_analysis: string;
  ai_recommendation: string;
  severity_score: number;
  auto_suspended: boolean;
  investigation_data: {
    reported_user?: {
      username: string;
      bio: string | null;
      age: number | null;
      created_at: string;
    };
    recent_messages_count: number;
    ephemeral_media_count: number;
    contacts_count: number;
    contact_user_ids: string[];
    messages_sample?: Array<{
      id: string;
      content: string;
      type: string;
      is_private: boolean;
      created_at: string;
    }>;
    ephemeral_media?: Array<{
      id: string;
      type: string;
      url: string;
      message_id: string;
    }>;
  };
  contacts_notified: boolean;
  investigation_start: string;
  investigation_end: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  created_at: string;
  updated_at: string;
  reported_user?: {
    username: string;
    avatar_url: string | null;
  };
  original_report?: {
    reason: string;
    description: string | null;
    reporter?: {
      username: string;
    };
  };
}

export interface InvestigationNotification {
  id: string;
  ai_report_id: string;
  notified_user_id: string;
  reported_user_id: string;
  notification_sent_at: string;
  data_access_expires_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

export const useAIReports = (status?: string) => {
  return useQuery({
    queryKey: ['ai-reports', status],
    queryFn: async (): Promise<AIReport[]> => {
      let query = supabase
        .from('ai_moderation_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      // Fetch profiles
      const userIds = [...new Set(data.map(r => r.reported_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch original reports
      const reportIds = data.filter(r => r.report_id).map(r => r.report_id);
      let reportMap = new Map();
      if (reportIds.length > 0) {
        const { data: reports } = await supabase
          .from('reports')
          .select('id, reason, description, reporter_id')
          .in('id', reportIds);

        const reporterIds = reports?.map(r => r.reporter_id) || [];
        const { data: reporters } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', reporterIds);

        const reporterMap = new Map(reporters?.map(p => [p.user_id, p]) || []);

        reports?.forEach(r => {
          reportMap.set(r.id, {
            ...r,
            reporter: reporterMap.get(r.reporter_id),
          });
        });
      }

      return data.map(report => ({
        ...report,
        investigation_data: report.investigation_data as AIReport['investigation_data'],
        status: report.status as AIReport['status'],
        reported_user: profileMap.get(report.reported_user_id),
        original_report: report.report_id ? reportMap.get(report.report_id) : undefined,
      }));
    },
  });
};

export const useAIReportDetails = (reportId: string) => {
  return useQuery({
    queryKey: ['ai-report', reportId],
    queryFn: async (): Promise<AIReport | null> => {
      const { data, error } = await supabase
        .from('ai_moderation_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .eq('user_id', data.reported_user_id)
        .single();

      return {
        ...data,
        investigation_data: data.investigation_data as AIReport['investigation_data'],
        status: data.status as AIReport['status'],
        reported_user: profile || undefined,
      };
    },
    enabled: !!reportId,
  });
};

export const useResolveAIReport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      action,
      notes,
      unblockUser = false,
    }: {
      reportId: string;
      action: 'resolved' | 'escalated';
      notes: string;
      unblockUser?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the report to find the user
      const { data: report } = await supabase
        .from('ai_moderation_reports')
        .select('reported_user_id')
        .eq('id', reportId)
        .single();

      if (!report) throw new Error('Report not found');

      // Update the AI report
      const { error } = await supabase
        .from('ai_moderation_reports')
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          investigation_end: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // Unblock user if requested
      if (unblockUser) {
        await supabase
          .from('user_blocks')
          .update({
            is_active: false,
            unblocked_at: new Date().toISOString(),
          })
          .eq('user_id', report.reported_user_id)
          .eq('is_active', true);

        // Notify user about unblock
        await supabase
          .from('notifications')
          .insert({
            user_id: report.reported_user_id,
            type: 'account_restored',
            title: '✅ Compte restauré',
            message: 'Après investigation, votre compte a été restauré. Nous vous remercions pour votre patience.',
            is_read: false,
          });
      }

      // Log moderation action
      await supabase
        .from('moderation_actions')
        .insert({
          action_type: action === 'resolved' ? 'report_resolved' : 'report_dismissed',
          target_user_id: report.reported_user_id,
          performed_by: user.id,
          details: `Investigation IA ${action === 'resolved' ? 'résolue' : 'escaladée'}: ${notes}`,
          metadata: {
            ai_report_id: reportId,
            unblocked: unblockUser,
          },
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
      toast.success('Rapport traité avec succès');
    },
    onError: (error) => {
      console.error('Error resolving AI report:', error);
      toast.error('Erreur lors du traitement');
    },
  });
};

export const useInvestigationNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investigation-notifications', user?.id],
    queryFn: async (): Promise<InvestigationNotification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('investigation_notifications')
        .select('*')
        .eq('notified_user_id', user.id)
        .order('notification_sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useAcknowledgeInvestigation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('investigation_notifications')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation-notifications'] });
    },
  });
};

export const useUserConversationsForInvestigation = (userId: string) => {
  return useQuery({
    queryKey: ['investigation-conversations', userId],
    queryFn: async () => {
      const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      // Fetch all messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .gte('created_at', last48h)
        .order('created_at', { ascending: false });

      // Fetch ephemeral media
      const messageIds = messages?.map(m => m.id) || [];
      let ephemeralMedia: any[] = [];
      if (messageIds.length > 0) {
        const { data } = await supabase
          .from('ephemeral_media')
          .select('*')
          .in('message_id', messageIds);
        ephemeralMedia = data || [];
      }

      // Fetch user profiles involved
      const userIds = new Set<string>();
      messages?.forEach(m => {
        if (m.sender_id) userIds.add(m.sender_id);
        if (m.recipient_id) userIds.add(m.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', Array.from(userIds));

      return {
        messages: messages || [],
        ephemeralMedia,
        profiles: profiles || [],
      };
    },
    enabled: !!userId,
  });
};
