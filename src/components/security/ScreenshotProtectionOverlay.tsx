import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

interface ScreenshotProtectionOverlayProps {
  isActive: boolean;
}

/**
 * Simple black overlay when screenshot detected
 */
const ScreenshotProtectionOverlay = memo(({
  isActive,
}: ScreenshotProtectionOverlayProps) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.05 }}
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white text-center"
        >
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium opacity-70">Contenu protégé</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ScreenshotProtectionOverlay.displayName = 'ScreenshotProtectionOverlay';

export default ScreenshotProtectionOverlay;
