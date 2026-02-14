import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ShoppingCart, 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Euro,
  Coins,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { notifyCreditPurchaseApproved, notifyCreditPurchaseRejected } from '@/services/pushNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  region: string;
}

interface PurchaseRequest {
  id: string;
  user_id: string;
  amount: number;
  price_euros: number;
  payment_method: string | null;
  payment_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  profile?: Profile;
}

const CreditPurchaseRequestsPanel = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isApproving, setIsApproving] = useState(true);
  const queryClient = useQueryClient();

  // Fetch all purchase requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-credit-purchase-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('credit_purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles
      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, region')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data?.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id),
      })) as PurchaseRequest[];
    },
    refetchInterval: 30000,
  });

  // Process request mutation
  const processMutation = useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error: updateError } = await supabase
        .from('credit_purchase_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          admin_notes: adminNotes || null,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, add credits to user
      if (approve) {
        const { error: creditError } = await supabase.rpc('add_credits', {
          _user_id: request.user_id,
          _amount: request.amount,
          _credit_type: 'purchased',
          _transaction_type: 'purchase',
          _description: `Achat de ${request.amount} crédits (${request.price_euros}€)`,
        });

        if (creditError) throw creditError;

        // Notify user that their credits have been approved
        await notifyCreditPurchaseApproved(request.user_id, request.amount, request.price_euros);
      } else {
        // Notify user that their purchase was rejected
        await notifyCreditPurchaseRejected(request.user_id, adminNotes || undefined);
      }
    },
    onSuccess: (_, { approve }) => {
      toast.success(approve ? 'Achat validé ! Crédits ajoutés.' : 'Demande rejetée.');
      queryClient.invalidateQueries({ queryKey: ['admin-credit-purchase-requests'] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du traitement');
    },
  });

  const filteredRequests = requests.filter(r =>
    r.profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalPending: requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.price_euros, 0),
  };

  const openProcessDialog = (request: PurchaseRequest, approve: boolean) => {
    setSelectedRequest(request);
    setIsApproving(approve);
    setAdminNotes('');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Demandes d'achat de crédits</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Euro className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{stats.totalPending.toFixed(2)}€</p>
            <p className="text-xs text-muted-foreground">Montant en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Validés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejetés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou référence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="gap-1">
            En attente
            {stats.pending > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Validés</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <ScrollArea className="h-[400px]">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande {statusFilter !== 'all' && `avec le statut "${statusFilter}"`}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((request) => (
                  <PurchaseRequestCard
                    key={request.id}
                    request={request}
                    onApprove={() => openProcessDialog(request, true)}
                    onReject={() => openProcessDialog(request, false)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Process Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isApproving ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Valider l'achat
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  Rejeter la demande
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isApproving 
                ? `Valider l'achat de ${selectedRequest?.amount} crédits pour ${selectedRequest?.profile?.username} ?`
                : `Rejeter la demande de ${selectedRequest?.profile?.username} ?`
              }
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-10 h-10">
                    {selectedRequest.profile?.avatar_url ? (
                      <AvatarImage src={selectedRequest.profile.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {selectedRequest.profile?.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedRequest.profile?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Crédits :</span>
                    <span className="ml-2 font-medium">{selectedRequest.amount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prix :</span>
                    <span className="ml-2 font-medium">{selectedRequest.price_euros}€</span>
                  </div>
                  {selectedRequest.payment_method && (
                    <div>
                      <span className="text-muted-foreground">Méthode :</span>
                      <span className="ml-2">{selectedRequest.payment_method}</span>
                    </div>
                  )}
                  {selectedRequest.payment_reference && (
                    <div>
                      <span className="text-muted-foreground">Ref :</span>
                      <span className="ml-2 font-mono text-xs">{selectedRequest.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes admin (optionnel)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isApproving ? "Ex: Paiement vérifié via PayPal" : "Ex: Référence de paiement non trouvée"}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedRequest && processMutation.mutate({ 
                requestId: selectedRequest.id, 
                approve: isApproving 
              })}
              disabled={processMutation.isPending}
              className={isApproving 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-red-500 hover:bg-red-600"
              }
            >
              {processMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : isApproving ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {isApproving ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
  onApprove: () => void;
  onReject: () => void;
}

const PurchaseRequestCard = ({ request, onApprove, onReject }: PurchaseRequestCardProps) => {
  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-amber-500' },
    approved: { label: 'Validé', color: 'bg-green-500' },
    rejected: { label: 'Rejeté', color: 'bg-red-500' },
  };

  const status = statusConfig[request.status];

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            {request.profile?.avatar_url ? (
              <AvatarImage src={request.profile.avatar_url} alt={request.profile.username} />
            ) : (
              <AvatarFallback>
                {request.profile?.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-medium">{request.profile?.username || 'Unknown'}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {request.amount} crédits
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Euro className="w-3.5 h-3.5" />
                {request.price_euros}€
              </span>
            </div>
            {request.payment_reference && (
              <p className="text-xs text-muted-foreground mt-1">
                Ref: <span className="font-mono">{request.payment_reference}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge className={cn("text-white", status.color)}>
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>

      {request.status === 'pending' && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
          <Button size="sm" variant="outline" onClick={onReject} className="text-red-500">
            <XCircle className="w-4 h-4 mr-1" />
            Rejeter
          </Button>
          <Button size="sm" onClick={onApprove} className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Valider
          </Button>
        </div>
      )}

      {request.admin_notes && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {request.admin_notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditPurchaseRequestsPanel;
