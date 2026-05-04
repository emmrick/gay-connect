import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdImageUpload from './AdImageUpload';

interface EditAdDialogProps {
  ad: any;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, any>) => void;
}

const EditAdDialog = ({ ad, onClose, onSave }: EditAdDialogProps) => {
  const [title, setTitle] = useState(ad.title);
  const [description, setDescription] = useState(ad.description || '');
  const [imageUrl, setImageUrl] = useState(ad.image_url || '');
  const [linkUrl, setLinkUrl] = useState(ad.link_url || '');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
          <AdImageUpload value={imageUrl} onChange={setImageUrl} label="Image de l'annonce" />
          <div>
            <label className="text-xs font-medium">URL destination</label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() =>
              onSave(ad.id, {
                title,
                description: description || null,
                image_url: imageUrl || null,
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
