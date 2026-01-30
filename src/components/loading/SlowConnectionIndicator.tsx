import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface SlowConnectionIndicatorProps {
  isLoading: boolean;
  delayMs?: number;
  className?: string;
}

/**
 * Affiche un indicateur rassurant après un délai de chargement.
 * Montre à l'utilisateur que la connexion est lente mais l'app fonctionne.
 */
const SlowConnectionIndicator = ({ 
  isLoading, 
  delayMs = 3000,
  className = ''
}: SlowConnectionIndicatorProps) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowIndicator(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowIndicator(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-2 text-muted-foreground text-sm ${className}`}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Wifi className="w-4 h-4 text-warning" />
          </motion.div>
          <span>Connexion lente, merci de patienter...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlowConnectionIndicator;
