import { cn } from '@/lib/utils';
import { User, Check, MoveVertical } from 'lucide-react';

interface CaptureGuideOverlayProps {
  type: 'selfie' | 'id_front' | 'id_back';
  isGoodDistance?: boolean;
}

const CaptureGuideOverlay = ({ type, isGoodDistance = true }: CaptureGuideOverlayProps) => {
  // Only selfie overlay now
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      <div className="relative">
        <div 
          className={cn(
            "w-48 h-64 rounded-[50%] transition-all duration-300",
            isGoodDistance 
              ? "border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]" 
              : "border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
          )}
        />
        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="w-16 h-16 text-white/30" />
        </div>
      </div>
      
      <div className={cn(
        "mt-6 px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300",
        isGoodDistance ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-black"
      )}>
        {isGoodDistance ? (
          <><Check className="w-4 h-4" /><span className="text-sm font-medium">Bonne distance</span></>
        ) : (
          <><MoveVertical className="w-4 h-4" /><span className="text-sm font-medium">Rapproche-toi</span></>
        )}
      </div>
      
      <div className="absolute bottom-24 left-4 right-4">
        <div className="bg-black/70 rounded-xl px-4 py-3 text-white text-center">
          <p className="text-sm font-medium mb-1">Place ton visage dans l'ovale</p>
          <p className="text-xs text-white/70">Garde une expression neutre et regarde la caméra</p>
        </div>
      </div>
    </div>
  );
};

export default CaptureGuideOverlay;
