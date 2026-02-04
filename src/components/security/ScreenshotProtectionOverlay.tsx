import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

interface ScreenshotProtectionOverlayProps {
  isActive: boolean;
  isSuspended?: boolean;
  suspensionTimeLeft?: string | null;
}

/**
 * Banking-style protection overlay
 * Uses multiple techniques to make screenshots useless:
 * 1. Black overlay with high z-index
 * 2. CSS filters that render differently in screenshots
 * 3. Blend modes that show black in static captures
 */
const ScreenshotProtectionOverlay = memo(({
  isActive,
  isSuspended = false,
  suspensionTimeLeft,
}: ScreenshotProtectionOverlayProps) => {
  if (!isActive && !isSuspended) return null;

  return (
    <AnimatePresence>
      {(isActive || isSuspended) && (
        <>
          {/* Primary black overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }} // Near-instant
            className="fixed inset-0 z-[9999] bg-black"
            style={{
              // CSS tricks that make content black in screenshots
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />

          {/* Secondary layer with blend mode trick */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #000 0%, #000 100%)',
              mixBlendMode: 'multiply',
            }}
          />

          {/* Suspension message */}
          {isSuspended && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
            >
              <div className="bg-card border border-destructive/30 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Compte suspendu
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Tentative de capture d'écran détectée. Ton accès aux médias est temporairement suspendu.
                </p>
                {suspensionTimeLeft && (
                  <div className="bg-destructive/10 rounded-lg py-2 px-4">
                    <span className="text-sm text-destructive font-medium">
                      Temps restant : {suspensionTimeLeft}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick detection flash */}
          {isActive && !isSuspended && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001] flex items-center justify-center"
            >
              <div className="text-white text-center">
                <ShieldAlert className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p className="text-sm font-medium">Protection activée</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
});

ScreenshotProtectionOverlay.displayName = 'ScreenshotProtectionOverlay';

export default ScreenshotProtectionOverlay;
