import { X, Send, Loader2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RegularMediaPreviewProps {
  previewUrl: string;
  mediaType: 'image' | 'video';
  isUploading: boolean;
  progress: number;
  onSend: () => void;
  onCancel: () => void;
}

const RegularMediaPreview = ({
  previewUrl,
  mediaType,
  isUploading,
  progress,
  onSend,
  onCancel,
}: RegularMediaPreviewProps) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-center font-display flex flex-col items-center gap-2">
            <span>Envoyer {mediaType === 'image' ? 'une photo' : 'une vidéo'}</span>
            <Badge variant="outline" className="text-amber-500 border-amber-500/50">
              <ShieldOff className="w-3 h-3 mr-1" />
              Non protégé
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-4 space-y-4">
            {/* Media preview */}
            <div className="flex items-center justify-center bg-secondary/30 rounded-xl overflow-hidden">
              {mediaType === 'image' ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[40vh] object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="max-w-full max-h-[40vh] object-contain"
                  controls
                />
              )}
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                ⚠️ Ce média sera visible indéfiniment et téléchargeable par le destinataire
              </p>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Envoi en cours... {progress}%
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600"
            onClick={onSend}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegularMediaPreview;
