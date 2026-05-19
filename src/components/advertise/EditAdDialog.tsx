import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import AdImagesUpload from './AdImagesUpload';
import { AdPreviewGrid } from '@/components/ads/AdPreview';

interface EditAdDialogProps {
  ad: any;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, any>) => void;
}

const EditAdDialog = ({ ad, onClose, onSave }: EditAdDialogProps) => {
  const [title, setTitle] = useState(ad.title);
  const [description, setDescription] = useState(ad.description || '');
  const initialImages: string[] = Array.isArray(ad.image_urls) && ad.image_urls.length > 0
    ? ad.image_urls
    : (ad.image_url ? [ad.image_url] : []);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [linkUrl, setLinkUrl] = useState(ad.link_url || '');

  const placement = (ad.placement as 'compact' | 'native' | 'sponsored_card') || 'native';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier l'annonce</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Titre</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <AdImagesUpload value={imageUrls} onChange={setImageUrls} />
          <div>
            <label className="text-xs font-medium">URL destination</label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>

          {/* Aperçu en direct */}
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Aperçu en direct</h4>
              <Badge variant="outline" className="text-[9px] ml-auto">
                {imageUrls.length > 1 ? 'Rotation automatique' : 'Tel que vu par les utilisateurs'}
              </Badge>
            </div>
            <AdPreviewGrid
              selectedPlacements={[placement]}
              title={title}
              description={description}
              imageUrl={imageUrls[0] || ''}
              imageUrls={imageUrls}
              hasLink={!!linkUrl}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() =>
              onSave(ad.id, {
                title,
                description: description || null,
                image_url: imageUrls[0] || null,
                image_urls: imageUrls,
                link_url: linkUrl || null,
              })
            }
          >
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdDialog;
