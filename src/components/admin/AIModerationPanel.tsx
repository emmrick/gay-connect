import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Eye,
  Shield,
  MessageSquare,
  Image,
  Users,
  ChevronRight,
  Unlock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  useAIReports,
  useResolveAIReport,
  useUserConversationsForInvestigation,
  AIReport,
} from '@/hooks/useAIModeration';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  investigating: { label: 'En cours', color: 'bg-blue-500', icon: Eye },
  resolved: { label: 'Résolu', color: 'bg-green-500', icon: CheckCircle },
  escalated: { label: 'Escaladé', color: 'bg-red-500', icon: ArrowUpRight },
};

const getSeverityColor = (score: number) => {
  if (score >= 75) return 'text-red-500';
  if (score >= 50) return 'text-orange-500';
  if (score >= 25) return 'text-yellow-500';
  return 'text-green-500';
};

const AIReportCard = ({
  report,
  onClick,
}: {
  report: AIReport;
  onClick: () => void;
}) => {
  const status = statusConfig[report.status];
  const StatusIcon = status.icon;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={report.reported_user?.avatar_url || ''} />
            <AvatarFallback>
              {report.reported_user?.username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">
                {report.reported_user?.username || 'Utilisateur inconnu'}
              </span>
              <Badge
                variant="outline"
                className={`${status.color} bg-opacity-20`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Bot className="w-4 h-4" />
                Score: <span className={getSeverityColor(report.severity_score)}>{report.severity_score}</span>/100
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {report.investigation_data?.recent_messages_count || 0} messages
              </span>
              <span className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                {report.investigation_data?.ephemeral_media_count || 0} médias
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {report.ai_analysis}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(report.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
            <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InvestigationDetailDialog = ({
  report,
  open,
  onOpenChange,
}: {
  report: AIReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [notes, setNotes] = useState('');
  const [unblockUser, setUnblockUser] = useState(false);
  const resolveReport = useResolveAIReport();

  const { data: conversationData, isLoading: loadingConversations } =
    useUserConversationsForInvestigation(report?.reported_user_id || '');

  if (!report) return null;

  const handleResolve = (action: 'resolved' | 'escalated') => {
    resolveReport.mutate(
      {
        reportId: report.id,
        action,
        notes,
        unblockUser,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNotes('');
          setUnblockUser(false);
        },
      }
    );
  };

  const profileMap = new Map(
    conversationData?.profiles?.map((p) => [p.user_id, p]) || []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Investigation IA - {report.reported_user?.username || 'Utilisateur'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="analysis" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
            <TabsTrigger value="action">Action</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Severity Score */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score de gravité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={report.severity_score} className="flex-1" />
                      <span className={`text-2xl font-bold ${getSeverityColor(report.severity_score)}`}>
                        {report.severity_score}/100
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Analyse automatique
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{report.ai_analysis}</p>
                  </CardContent>
                </Card>

                {/* AI Recommendation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Recommandation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{report.ai_recommendation}</p>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {report.investigation_data?.recent_messages_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Messages (48h)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {report.investigation_data?.ephemeral_media_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Médias éphémères</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {report.investigation_data?.contacts_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Contacts avertis</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Original Report */}
                {report.original_report && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Signalement original
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        <strong>Raison:</strong> {report.original_report.reason}
                      </p>
                      {report.original_report.description && (
                        <p className="text-sm mt-2">
                          <strong>Description:</strong> {report.original_report.description}
                        </p>
                      )}
                      {report.original_report.reporter && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          Signalé par: {report.original_report.reporter.username}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loadingConversations ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : conversationData?.messages?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun message dans les dernières 48h</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversationData?.messages?.map((message) => {
                    const sender = profileMap.get(message.sender_id);
                    const isSuspect = message.sender_id === report.reported_user_id;

                    return (
                      <Card
                        key={message.id}
                        className={isSuspect ? 'border-orange-500/50' : ''}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={sender?.avatar_url || ''} />
                              <AvatarFallback>
                                {sender?.username?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {sender?.username || 'Inconnu'}
                                </span>
                                {isSuspect && (
                                  <Badge variant="destructive" className="text-xs">
                                    Suspect
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), 'dd/MM HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                {message.content || `[${message.message_type}]`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <ScrollArea className="h-[400px]">
              {conversationData?.ephemeralMedia?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun média éphémère</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {conversationData?.ephemeralMedia?.map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {media.media_type?.startsWith('image') ? (
                          <img
                            src={media.media_url}
                            alt="Media"
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {media.media_type}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="action" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes de résolution</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Décrivez votre décision et les raisons..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="unblock"
                  checked={unblockUser}
                  onCheckedChange={setUnblockUser}
                />
                <Label htmlFor="unblock">
                  Débloquer l'utilisateur après résolution
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleResolve('resolved')}
                  disabled={resolveReport.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Résoudre (Innocent)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleResolve('escalated')}
                  disabled={resolveReport.isPending}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Escalader (Coupable)
                </Button>
              </div>

              {report.auto_suspended && (
                <p className="text-sm text-muted-foreground text-center">
                  ⚠️ L'utilisateur a été automatiquement suspendu par l'IA
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const AIModerationPanel = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('investigating');
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);
  const { data: reports, isLoading } = useAIReports(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const stats = {
    pending: reports?.filter((r) => r.status === 'pending').length || 0,
    investigating: reports?.filter((r) => r.status === 'investigating').length || 0,
    resolved: reports?.filter((r) => r.status === 'resolved').length || 0,
    escalated: reports?.filter((r) => r.status === 'escalated').length || 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Modération IA</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.investigating}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escaladés</p>
                <p className="text-2xl font-bold">{stats.escalated}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Tabs
        value={selectedStatus}
        onValueChange={setSelectedStatus}
      >
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="investigating">En cours</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="resolved">Résolus</TabsTrigger>
          <TabsTrigger value="escalated">Escaladés</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)]">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : reports?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun rapport dans cette catégorie</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports?.map((report) => (
                  <AIReportCard
                    key={report.id}
                    report={report}
                    onClick={() => setSelectedReport(report)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <InvestigationDetailDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </div>
  );
};

export default AIModerationPanel;
