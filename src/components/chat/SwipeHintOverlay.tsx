import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Archive, Trash2 } from 'lucide-react';

interface SwipeHintOverlayProps {
  onDismiss: () => void;
}

const SwipeHintOverlay = ({ onDismiss }: SwipeHintOverlayProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Auto-advance animation steps
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 3) {
          return 0; // Loop the animation
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss after showing the hint a few times
  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => clearTimeout(dismissTimer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-xl max-w-xs w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-semibold text-lg text-foreground mb-4">
          Geste de balayage
        </h3>
        
        {/* Swipe animation demo */}
        <div className="relative h-20 bg-secondary/50 rounded-xl overflow-hidden mb-4">
          {/* Left action hint */}
          <motion.div
            className="absolute inset-y-0 left-0 w-16 bg-blue-500 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: step === 1 ? 1 : 0 }}
          >
            <Archive className="w-5 h-5 text-white" />
          </motion.div>
          
          {/* Right action hint */}
          <motion.div
            className="absolute inset-y-0 right-0 w-16 bg-destructive flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: step === 3 ? 1 : 0 }}
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.div>
          
          {/* Simulated conversation item */}
          <motion.div
            className="absolute inset-y-2 bg-background border border-border rounded-lg shadow-sm flex items-center px-4 gap-3"
            animate={{
              left: step === 0 ? 8 : step === 1 ? 64 : step === 2 ? 8 : -48,
              right: step === 0 ? 8 : step === 1 ? -48 : step === 2 ? 8 : 64,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-2 w-28 bg-muted/50 rounded mt-1" />
            </div>
          </motion.div>
          
          {/* Swipe direction arrows */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="arrows"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none"
              >
                <motion.div
                  animate={{ x: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Instructions */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <ChevronRight className="w-4 h-4 text-blue-500" />
            <span>Glisser à droite pour <span className="text-blue-500 font-medium">archiver</span></span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4 text-destructive" />
            <span>Glisser à gauche pour <span className="text-destructive font-medium">supprimer</span></span>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Compris !
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SwipeHintOverlay;
