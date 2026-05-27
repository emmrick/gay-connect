/**
 * PlanNowAlbumShareSheet — Sheet pour choisir un album à partager pendant 30 min
 * dans le cadre d'un Plan Now mutuel.
 */
import { useState } from 'react';
import { Lock, Globe, Zap, Loader2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlbums } from '@/hooks/useAlbums';
import { usePlanNowAlbumShare } from '@/hooks/usePlanNowAlbumShare';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  toUserId: string;
  toUsername?: string;
}

const PlanNowAlbumShareSheet = ({ open, onOpenChange, toUserId, toUsername }: Props) => {
  const { albums } = useAlbums();
  const { shareAlbum, isSharing, durationMinutes } = usePlanNowAlbumShare();
  const [selected, setSelected] = useState<string | null>(null);

  const handleShare = () => {
    if (!selected) return;
    const album = albums.find((a) => a.id === selected);
    if (!album) return;
    shareAlbum(
      { albumId: album.id, albumName: album.name, toUserId },
      { onSuccess: () => { onOpenChange(false); setSelected(null); } },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Échange d'album Plan Now
          </SheetTitle>
          <SheetDescription>
            Partagez un album avec {toUsername || 'cet utilisateur'} pendant{' '}
            <span className="font-semibold text-foreground">{durationMinutes} minutes</span>.
            Captures d'écran bloquées et watermark renforcé.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="max-h-[55vh] my-4 -mx-2">
          <div className="px-2 space-y-2">
            {albums.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Vous n'avez pas encore d'album. Créez-en un depuis votre profil.
              </p>
            )}
            {albums.map((album) => {
              const isSelected = selected === album.id;
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => setSelected(album.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    {album.is_private ? (
                      <Lock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Globe className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{album.name}</p>
                    {album.description && (
                      <p className="text-xs text-muted-foreground truncate">{album.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 pt-2 pb-[env(safe-area-inset-bottom)] bg-background border-t">
          <Button
            onClick={handleShare}
            disabled={!selected || isSharing}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white"
            size="lg"
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Partager pour {durationMinutes} min
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlanNowAlbumShareSheet;
