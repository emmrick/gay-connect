import { memo } from 'react';
import GaySocialWatermark from '@/components/security/GaySocialWatermark';
import { ShieldAlert } from 'lucide-react';

interface TweenMediaProps {
  url: string;
  type: 'image' | 'video';
}

/**
 * Affichage protégé d'un média Tween :
 *  - Filigrane "Gay Social" en surimpression
 *  - Désactivation du clic droit / drag / sélection
 *  - Pour les vidéos : pas de bouton de téléchargement (controlsList=nodownload)
 *  - Bandeau légal indiquant l'interdiction de téléchargement
 */
const TweenMedia = memo(({ url, type }: TweenMediaProps) => {
  const blockContextMenu = (e: React.MouseEvent | React.SyntheticEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="relative w-full mt-3 rounded-xl overflow-hidden border border-border/20 select-none"
      onContextMenu={blockContextMenu}
      onDragStart={blockContextMenu as any}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {type === 'image' ? (
        <img
          src={url}
          alt=""
          className="w-full max-h-80 object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
          onContextMenu={blockContextMenu}
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        />
      ) : (
        <video
          src={url}
          controls
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          className="w-full max-h-80 object-cover bg-black"
          onContextMenu={blockContextMenu}
        />
      )}

      {/* Filigrane visible */}
      <GaySocialWatermark />

      {/* Bandeau légal — discret en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/90 leading-tight">
          <ShieldAlert className="w-3 h-3 flex-shrink-0" />
          <span>Téléchargement et redistribution interdits — Contenu protégé Gay Social</span>
        </div>
      </div>
    </div>
  );
});

TweenMedia.displayName = 'TweenMedia';

export default TweenMedia;
