/**
 * PhotoExchangePanel — bannière affichée au-dessus du composer de chat privé
 * lorsqu'un échange de photos est actif (pending / accepted / awaiting_review / completed).
 */
import { useRef, useState } from 'react';
import { ImagePlus, Camera, Check, Hourglass, Eye, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActivePhotoExchange,
  usePhotoExchangeMutations,
  usePhotoExchangeSignedUrl,
  type PhotoExchangePhoto,
} from '@/hooks/usePhotoExchange';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  conversationId: string | null | undefined;
  otherUserId: string;
}

const PhotoExchangePanel = ({ conversationId, otherUserId }: Props) => {
  const { user } = useAuth();
  const { data } = useActivePhotoExchange(conversationId);
  const { respondToExchange, cancelExchange, uploadPhoto } = usePhotoExchangeMutations(conversationId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [revealPhotoId, setRevealPhotoId] = useState<string | null>(null);

  if (!data || !user) return null;
  const { exchange, photos } = data;
  const myPhoto = photos.find((p) => p.user_id === user.id);
  const otherPhoto = photos.find((p) => p.user_id !== user.id);
  const isInitiator = exchange.initiator_id === user.id;
  const isPending = exchange.status === 'pending';
  const isAccepted = exchange.status === 'accepted';
  const isReview = exchange.status === 'awaiting_review';
  const isCompleted = exchange.status === 'completed';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadPhoto.mutate({ exchangeId: exchange.id, file: f });
    e.target.value = '';
  };

  // États visuels
  let title = '';
  let subtitle = '';
  let actions: React.ReactNode = null;

  if (isPending && !isInitiator) {
    title = 'Échange de photos proposé';
    subtitle = 'Acceptez pour partager une photo, chacun ne verra celle de l\'autre qu\'après validation par la modération.';
    actions = (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => respondToExchange.mutate({ id: exchange.id, accept: false })}>
          <X className="w-4 h-4 mr-1" /> Refuser
        </Button>
        <Button size="sm" onClick={() => respondToExchange.mutate({ id: exchange.id, accept: true })}>
          <Check className="w-4 h-4 mr-1" /> Accepter
        </Button>
      </div>
    );
  } else if (isPending && isInitiator) {
    title = 'En attente de la réponse';
    subtitle = 'L\'autre membre doit accepter votre demande d\'échange.';
    actions = (
      <Button size="sm" variant="ghost" onClick={() => cancelExchange.mutate(exchange.id)}>
        Annuler
      </Button>
    );
  } else if (isAccepted) {
    const needsUpload = !myPhoto || myPhoto.review_status === 'rejected';
    title = needsUpload ? 'Envoyez votre photo' : 'En attente de l\'autre photo';
    subtitle = needsUpload
      ? (myPhoto?.review_status === 'rejected'
          ? `Refusée : ${myPhoto.review_reason ?? 'non conforme'}. Renvoyez une photo.`
          : 'Votre photo sera vérifiée par la modération avant d\'être révélée.')
      : 'L\'autre membre doit encore envoyer sa photo.';
    actions = needsUpload ? (
      <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploadPhoto.isPending}>
        {uploadPhoto.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Camera className="w-4 h-4 mr-1" />}
        {myPhoto ? 'Renvoyer' : 'Choisir une photo'}
      </Button>
    ) : (
      <span className="text-xs text-muted-foreground">Envoyée ✓</span>
    );
  } else if (isReview) {
    title = 'En cours de vérification';
    subtitle = 'Un modérateur vérifie les 2 photos. Vous serez notifié dès que c\'est validé.';
    actions = <Hourglass className="w-5 h-5 text-amber-500 animate-pulse" />;
  } else if (isCompleted) {
    title = 'Échange complété !';
    subtitle = 'Découvrez la photo reçue.';
    actions = otherPhoto ? (
      <Button size="sm" onClick={() => setRevealPhotoId(otherPhoto.id)}>
        <Eye className="w-4 h-4 mr-1" /> Voir la photo
      </Button>
    ) : null;
  }

  return (
    <>
      <div className="mx-3 mb-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <ImagePlus className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">{title}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{subtitle}</p>
          </div>
          <div className="flex-shrink-0">{actions}</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <PhotoRevealDialog photoId={revealPhotoId} onClose={() => setRevealPhotoId(null)} />
    </>
  );
};

const PhotoRevealDialog = ({ photoId, onClose }: { photoId: string | null; onClose: () => void }) => {
  const { data: url, isLoading } = usePhotoExchangeSignedUrl(photoId);
  return (
    <Dialog open={!!photoId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Photo reçue</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="aspect-square flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : url ? (
          <img src={url} alt="Photo échangée" className="w-full rounded-xl" />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Photo indisponible.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoExchangePanel;
