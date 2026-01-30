import { useState } from 'react';
import { useVerificationHistory } from '@/hooks/useIdentityVerification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield,
  Calendar,
  UserCheck
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface VerificationWithProfiles {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  documents_deleted: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    age: number | null;
    region: string;
  } | null;
  reviewerProfile: {
    user_id: string;
    username: string;
  } | null;
}

const statusConfig: Record<VerificationStatus, { 
  label: string; 
  icon: React.ElementType; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  pending: { 
    label: 'En attente', 
    icon: Clock, 
    variant: 'outline',
    color: 'text-yellow-500'
  },
  approved: { 
    label: 'Approuvé', 
    icon: CheckCircle2, 
    variant: 'default',
    color: 'text-green-500'
  },
  rejected: { 
    label: 'Refusé', 
    icon: XCircle, 
    variant: 'destructive',
    color: 'text-destructive'
  },
};

const VerificationHistoryPanel = () => {
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'all'>('all');
  
  const { data: verifications, isLoading } = useVerificationHistory(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const getStatusCounts = () => {
    if (!verifications) return { pending: 0, approved: 0, rejected: 0 };
    return {
      pending: verifications.filter(v => v.status === 'pending').length,
      approved: verifications.filter(v => v.status === 'approved').length,
      rejected: verifications.filter(v => v.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  const renderVerificationCard = (verification: VerificationWithProfiles) => {
    const status = verification.status as VerificationStatus;
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <div 
        key={verification.id}
        className="glass-card rounded-xl p-4 space-y-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={verification.profiles?.avatar_url || ''} />
              <AvatarFallback>
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{verification.profiles?.username || 'Utilisateur supprimé'}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{verification.profiles?.age || '?'} ans</span>
                <span>•</span>
                <span>{verification.profiles?.region || 'Région inconnue'}</span>
              </div>
            </div>
          </div>
          
          <Badge variant={config.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Soumis {verification.submitted_at 
                ? formatDistanceToNow(new Date(verification.submitted_at), { addSuffix: true, locale: fr })
                : 'date inconnue'}
            </span>
          </div>
          
          {verification.reviewed_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="w-4 h-4" />
              <span>
                Traité {formatDistanceToNow(new Date(verification.reviewed_at), { addSuffix: true, locale: fr })}
              </span>
            </div>
          )}
        </div>

        {verification.reviewerProfile && (
          <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
            <span>Traité par </span>
            <span className="font-medium text-foreground">{verification.reviewerProfile.username}</span>
          </div>
        )}

        {verification.rejection_reason && (
          <div className="text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            <p className="font-medium text-destructive text-xs mb-1">Raison du refus :</p>
            <p className="text-muted-foreground">{verification.rejection_reason}</p>
          </div>
        )}

        {verification.documents_deleted && status === 'approved' && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Documents supprimés
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">Historique des vérifications</h2>
          <p className="text-sm text-muted-foreground">
            Toutes les demandes de vérification d'identité
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold">{counts.pending}</span>
          </div>
          <p className="text-sm text-muted-foreground">En attente</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold">{counts.approved}</span>
          </div>
          <p className="text-sm text-muted-foreground">Approuvées</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-2xl font-bold">{counts.rejected}</span>
          </div>
          <p className="text-sm text-muted-foreground">Refusées</p>
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as VerificationStatus | 'all')}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuvées</TabsTrigger>
          <TabsTrigger value="rejected">Refusées</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-0">
          <ScrollArea className="h-[calc(100vh-420px)]">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : verifications?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vérification {selectedStatus !== 'all' && `avec le statut "${statusConfig[selectedStatus as VerificationStatus]?.label}"`}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verifications?.map((verification) => renderVerificationCard(verification as VerificationWithProfiles))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VerificationHistoryPanel;
