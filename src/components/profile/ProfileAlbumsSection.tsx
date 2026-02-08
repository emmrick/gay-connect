import { useState, useEffect } from 'react';
import { FolderLock, Plus, ImageIcon, Loader2, ChevronRight, EyeOff, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAlbums } from '@/hooks/useAlbums';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import AlbumManager from '@/components/albums/AlbumManager';

const ProfileAlbumsSection = () => {
  const { albums, isLoading, useAlbumMedia } = useAlbums();
  const [showAlbumManager, setShowAlbumManager] = useState(false);
  const [hidePreview, setHidePreview] = useState(() => {
    try {
      return localStorage.getItem('album-hide-preview') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('album-hide-preview', hidePreview ? 'true' : 'false');
    } catch {}
  }, [hidePreview]);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <FolderLock className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Albums privés</h3>
                <p className="text-xs text-muted-foreground">{albums.length} album(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setHidePreview(!hidePreview)}
                title={hidePreview ? 'Afficher les aperçus' : 'Masquer les aperçus'}
              >
                {hidePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setShowAlbumManager(true)}
              >
                Gérer
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Albums grid */}
          {albums.length === 0 ? (
            <button
              onClick={() => setShowAlbumManager(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Créer un album</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {albums.slice(0, 6).map((album, index) => (
                <AlbumThumbnail 
                  key={album.id} 
                  album={album} 
                  index={index}
                  useAlbumMedia={useAlbumMedia}
                  onClick={() => setShowAlbumManager(true)}
                  hidePreview={hidePreview}
                />
              ))}
              {albums.length > 6 && (
                <button
                  onClick={() => setShowAlbumManager(true)}
                  className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  +{albums.length - 6}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Album Manager Sheet */}
      <AlbumManager isOpen={showAlbumManager} onClose={() => setShowAlbumManager(false)} />
    </>
  );
};

interface AlbumThumbnailProps {
  album: any;
  index: number;
  useAlbumMedia: (albumId: string) => any;
  onClick: () => void;
  hidePreview?: boolean;
}

const AlbumThumbnail = ({ album, index, useAlbumMedia, onClick, hidePreview }: AlbumThumbnailProps) => {
  const { data: media = [] } = useAlbumMedia(album.id);
  const coverImage = media[0]?.media_url;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl overflow-hidden relative group",
        "bg-secondary/50 hover:ring-2 hover:ring-primary/50 transition-all"
      )}
    >
      {hidePreview ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-secondary/80">
          <EyeOff className="w-5 h-5 text-muted-foreground/50" />
          <p className="text-[10px] text-muted-foreground/70 font-medium truncate max-w-full px-1">{album.name}</p>
        </div>
      ) : coverImage ? (
        <img 
          src={coverImage} 
          alt={album.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
        </div>
      )}
      
      {/* Overlay with album name and count - only when not hidden */}
      {!hidePreview && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          <p className="text-white text-xs font-medium truncate">{album.name}</p>
          <p className="text-white/70 text-[10px]">{media.length} média(s)</p>
        </div>
      )}

      {/* Media count badge */}
      <Badge 
        variant="secondary" 
        className="absolute top-1.5 right-1.5 text-[10px] py-0 px-1.5 bg-black/50 text-white border-0"
      >
        {media.length}
      </Badge>
    </motion.button>
  );
};

export default ProfileAlbumsSection;
