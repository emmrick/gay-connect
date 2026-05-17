/**
 * PhotoExchangeReviewDialog — UI de revue pour un échange de photos privé.
 *
 * Affiche les 2 photos côte à côte (URLs signées via RPC `get_photo_exchange_signed_url`),
 * permet d'approuver ou de rejeter chaque photo individuellement avec une raison,
 * et marque la mission de modération comme complétée une fois les 2 photos traitées.
 *
 * Utilisé depuis la file des missions (`PendingTasksPanel` / `MissionsPanel`) quand
 * une tâche de type `photo_exchange_review` est cliquée.
 */
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PhotoRow {
  id: string;
  exchange_id: string;
  user_id: string;
  storage_path: string;
  review_status: 'pending' | 'approved' | 'rejected';
  review_reason: string | null;
  retry_count: number;
  created_at: string;
  authorUsername?: string | null;
  authorAvatar?: string | null;
}

interface Props {
  exchangeId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const STATUS_META = {
  pending: { label: 'En attente', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300' },
  approved: { label: 'Approuvée', className: 'bg-green-500/15 text-green-700 dark:text-green-300' },
  rejected: { label: 'Rejetée', className: 'bg-red-500/15 text-red-700 dark:text-red-300' },
} as const;

const PhotoExchangeReviewDialog = ({ exchangeId, open, onOpenChange }: Props) => {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['photo-exchange-review', exchangeId],
    enabled: !!exchangeId && open,
    queryFn: async () => {
      if (!exchangeId) return null;
      const { data: exchange } = await supabase
        .from('photo_exchanges' as any)
        .select('*')
        .eq('id', exchangeId)
        .maybeSingle();
      const { data: photos } = await supabase
        .from('photo_exchange_photos' as any)
        .select('*')
        .eq('exchange_id', exchangeId)
        .order('created_at', { ascending: true });

      const userIds = Array.from(new Set(((photos as any[]) ?? []).map((p) => p.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const enriched: PhotoRow[] = ((photos as any[]) ?? []).map((p) => ({
        ...p,
        authorUsername: profMap.get(p.user_id)?.username ?? null,
        authorAvatar: profMap.get(p.user_id)?.avatar_url ?? null,
      }));
      return { exchange, photos: enriched };
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Revue d'échange de photos privé
          </DialogTitle>
          <DialogDescription>
            Vérifiez chaque photo individuellement. Les deux photos doivent être conformes
            (visage net, pas de contenu interdit). L'auteur peut retenter une fois en cas de rejet.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.photos?.length ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Aucune photo trouvée pour cet échange.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.photos.map((p) => (
              <PhotoReviewCard key={p.id} photo={p} onReviewed={() => { refetch(); qc.invalidateQueries({ queryKey: ['pending-tasks-history'] }); }} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PhotoReviewCard = ({
  photo,
  onReviewed,
}: {
  photo: PhotoRow;
  onReviewed: () => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [reason, setReason] = useState(photo.review_reason ?? '');
  const [submitting, setSubmitting] = useState<'approved' | 'rejected' | null>(null);
  const meta = STATUS_META[photo.review_status];

  useEffect(() => {
    let cancelled = false;
    setLoadingUrl(true);
    void supabase
      .rpc('get_photo_exchange_signed_url' as any, { _photo_id: photo.id })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setUrl((data as string) ?? null);
        setLoadingUrl(false);
      });
    return () => { cancelled = true; };
  }, [photo.id]);

  const decide = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && reason.trim().length < 3) {
      toast.error('Précisez une raison de rejet (min. 3 caractères)');
      return;
    }
    setSubmitting(decision);
    const { data, error } = await supabase.rpc('review_photo_exchange_photo' as any, {
      _photo_id: photo.id,
      _decision: decision,
      _reason: decision === 'rejected' ? reason.trim() : null,
    });
    setSubmitting(null);
    if (error || (data && (data as any).success === false)) {
      toast.error((data as any)?.error ?? error?.message ?? 'Échec');
      return;
    }
    toast.success(decision === 'approved' ? 'Photo approuvée' : 'Photo rejetée');
    onReviewed();
  };

  const isFinal = photo.review_status !== 'pending';

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="aspect-square bg-muted relative">
        {loadingUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : url ? (
          <img src={url} alt="Photo échange" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageOff className="w-8 h-8" />
          </div>
        )}
        <Badge className={cn('absolute top-2 right-2', meta.className)}>{meta.label}</Badge>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>@{photo.authorUsername ?? photo.user_id.slice(0, 6)}</span>
          <span>{format(new Date(photo.created_at), 'd MMM HH:mm', { locale: fr })}</span>
        </div>
        {photo.retry_count > 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            ⚠️ {photo.retry_count} nouvelle tentative
          </p>
        )}
        {isFinal && photo.review_reason && (
          <p className="text-xs bg-muted/50 rounded p-2">
            <span className="font-semibold">Raison : </span>{photo.review_reason}
          </p>
        )}
        {!isFinal && (
          <>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Raison (requise si rejet)
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Photo floue, visage masqué, contenu inapproprié…"
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-500/10 border-red-500/30"
                onClick={() => decide('rejected')}
                disabled={!!submitting}
              >
                {submitting === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                Rejeter
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => decide('approved')}
                disabled={!!submitting}
              >
                {submitting === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Approuver
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoExchangeReviewDialog;
