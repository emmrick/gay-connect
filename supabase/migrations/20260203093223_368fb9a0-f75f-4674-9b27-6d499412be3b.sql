-- Table pour stocker les rapports de modération IA
CREATE TABLE public.ai_moderation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL,
  ai_analysis TEXT NOT NULL,
  ai_recommendation TEXT NOT NULL,
  severity_score INTEGER NOT NULL DEFAULT 50, -- 0-100
  auto_suspended BOOLEAN NOT NULL DEFAULT false,
  investigation_data JSONB DEFAULT '{}',
  contacts_notified BOOLEAN NOT NULL DEFAULT false,
  investigation_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  investigation_end TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_ai_moderation_reports_user ON public.ai_moderation_reports(reported_user_id);
CREATE INDEX idx_ai_moderation_reports_status ON public.ai_moderation_reports(status);
CREATE INDEX idx_ai_moderation_reports_created ON public.ai_moderation_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_moderation_reports ENABLE ROW LEVEL SECURITY;

-- Politique admin seulement
CREATE POLICY "Admins can manage AI moderation reports"
ON public.ai_moderation_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Table pour les notifications d'investigation aux contacts
CREATE TABLE public.investigation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_report_id UUID REFERENCES public.ai_moderation_reports(id) ON DELETE CASCADE,
  notified_user_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  notification_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX idx_investigation_notifications_user ON public.investigation_notifications(notified_user_id);
CREATE INDEX idx_investigation_notifications_report ON public.investigation_notifications(ai_report_id);

-- Enable RLS
ALTER TABLE public.investigation_notifications ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their investigation notifications"
ON public.investigation_notifications
FOR SELECT
USING (auth.uid() = notified_user_id);

-- Politique: admins peuvent tout gérer
CREATE POLICY "Admins can manage investigation notifications"
ON public.investigation_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_ai_moderation_reports_updated_at
BEFORE UPDATE ON public.ai_moderation_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activer realtime pour les notifications d'investigation
ALTER PUBLICATION supabase_realtime ADD TABLE public.investigation_notifications;