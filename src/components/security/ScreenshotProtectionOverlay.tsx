import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';

interface ScreenshotProtectionOverlayProps {
  isActive: boolean;
}

/**
 * Black overlay that replaces screen content on screenshot detection.
 * Also injects CSS that makes the page render black during visibility changes
 * (app switcher, recent apps) so screenshots capture a black screen.
 */
const ScreenshotProtectionOverlay = memo(({
  isActive,
}: ScreenshotProtectionOverlayProps) => {
  // Inject CSS that turns page black when hidden (app switcher screenshots)
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'screenshot-protection-css';
    style.textContent = `
      @media screen {
        /* When page loses visibility, make everything black immediately */
        .screenshot-protection-active {
          transition: background-color 0ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('screenshot-protection-active');
    
    return () => {
      const el = document.getElementById('screenshot-protection-css');
      if (el) el.remove();
      document.documentElement.classList.remove('screenshot-protection-active');
    };
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="screenshot-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.02 }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          style={{ 
            // Ensure it covers absolutely everything
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000000',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-white text-center"
          >
            <Shield className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <div className="flex items-center gap-2 justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-lg font-bold opacity-90">Capture d'écran détectée</p>
            </div>
            <p className="text-sm opacity-50 max-w-xs mx-auto">
              Le contenu est protégé. Cette tentative a été enregistrée.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ScreenshotProtectionOverlay.displayName = 'ScreenshotProtectionOverlay';

export default ScreenshotProtectionOverlay;
