import { useRef, useState } from 'react';
import { X, Star, Loader2, ImagePlus, Check } from 'lucide-react';
import { useProfilePhotos } from '@/hooks/useProfilePhotos';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const PhotoGalleryManager = () => {
  const { photos, isLoading, uploadPhoto, deletePhoto, setPrimaryPhoto, canAddMore } = useProfilePhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('La photo ne doit pas dépasser 10 Mo');
      return;
    }

    await uploadPhoto.mutateAsync(file);
    e.target.value = '';
  };

  const handleDelete = async (photoId: string) => {
    await deletePhoto.mutateAsync(photoId);
    setDeleteConfirm(null);
    setSelectedPhotoId(null);
  };

  const handleSetPrimary = async (photoId: string) => {
    await setPrimaryPhoto.mutateAsync(photoId);
    setSelectedPhotoId(null);
  };

  const handlePhotoTap = (photoId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // Already primary, just toggle selection for delete
      setSelectedPhotoId(selectedPhotoId === photoId ? null : photoId);
    } else {
      // Not primary, toggle selection
      setSelectedPhotoId(selectedPhotoId === photoId ? null : photoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Mes photos</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length}/6 photos • Touche pour sélectionner
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        {photos.map((photo, index) => {
          const isSelected = selectedPhotoId === photo.id;
          
          return (
            <div
              key={photo.id}
              onClick={() => handlePhotoTap(photo.id, photo.is_primary)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
                "bg-secondary border-2",
                isSelected 
                  ? "border-primary ring-2 ring-primary/30 scale-[0.98]" 
                  : "border-transparent",
                photo.is_primary && !isSelected && "border-primary/50"
              )}
            >
              <img
                src={photo.photo_url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {photo.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Profil
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {/* Darken overlay when selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* Add photo button */}
        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30",
              "flex flex-col items-center justify-center gap-2",
              "hover:border-primary hover:bg-primary/5 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {uploadPhoto.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Action buttons when photo is selected */}
      {selectedPhotoId && (
        <div className="flex gap-2 pt-2">
          {/* Set as primary button - only show if not already primary */}
          {!photos.find(p => p.id === selectedPhotoId)?.is_primary && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => handleSetPrimary(selectedPhotoId)}
              disabled={setPrimaryPhoto.isPending}
            >
              {setPrimaryPhoto.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Photo de profil
            </Button>
          )}
          
          {/* Delete button */}
          <Button
            variant="destructive"
            size="sm"
            className={photos.find(p => p.id === selectedPhotoId)?.is_primary ? "flex-1" : ""}
            onClick={() => setDeleteConfirm(selectedPhotoId)}
          >
            <X className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          
          {/* Cancel button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPhotoId(null)}
          >
            Annuler
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground">
        <p>💡 <strong>Conseils :</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
          <li>Touche une photo pour la sélectionner</li>
          <li>Définis ta photo de profil en appuyant sur "Photo de profil"</li>
          <li>Ajoute jusqu'à 6 photos pour augmenter tes chances</li>
        </ul>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La photo sera définitivement supprimée de votre profil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePhoto.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhotoGalleryManager;
