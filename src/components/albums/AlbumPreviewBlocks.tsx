import { useState } from 'react';
import { FolderLock, Lock, Eye, ImageIcon } from 'lucide-react';
import { useAlbums } from '@/hooks/useAlbums';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AlbumPreviewBlocksProps {
  userId: string;
  onAlbumClick?: (albumId: string) => void;
  className?: string;
}

/**
 * Shows album cover blocks inline (e.g. after profile photos).
 * Private albums show blurred cover + lock icon.
 * Only renders if the user has at least one album.
 */
const AlbumPreviewBlocks = ({ userId, onAlbumClick, className }: AlbumPreviewBlocksProps) => {
  const { albums, isLoading, useAlbumMedia } = useAlbums(userId);

  if (isLoading || albums.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-3 gap-1.5", className)}>
      {albums.slice(0, 6).map((album) => (
        <AlbumBlock
          key={album.id}
          album={album}
          useAlbumMedia={useAlbumMedia}
          onClick={() => onAlbumClick?.(album.id)}
        />
      ))}
    </div>
  );
};

const AlbumBlock = ({
  album,
  useAlbumMedia,
  onClick,
}: {
  album: any;
  useAlbumMedia: (id: string) => any;
  onClick: () => void;
}) => {
  const { data: media = [] } = useAlbumMedia(album.id);
  const coverUrl = media[0]?.media_url;
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden bg-muted/70 group"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={album.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity",
            loaded ? "opacity-100" : "opacity-0",
            album.is_private && "blur-lg scale-110"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
        {album.is_private ? (
          <Lock className="w-5 h-5 text-white drop-shadow-md" />
        ) : (
          <FolderLock className="w-5 h-5 text-white drop-shadow-md" />
        )}
        <span className="text-[10px] text-white font-medium truncate max-w-[90%] px-1 drop-shadow">
          {album.name}
        </span>
        <Badge
          variant="secondary"
          className="text-[8px] py-0 px-1.5 h-3.5 bg-white/20 text-white border-0"
        >
          {media.length} {media.length > 1 ? 'médias' : 'média'}
        </Badge>
      </div>
    </button>
  );
};

export default AlbumPreviewBlocks;
