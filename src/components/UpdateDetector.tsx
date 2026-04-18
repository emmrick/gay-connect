import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, AlertTriangle, Rocket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const CHECK_INTERVAL = 30_000; // 30s

const UpdateDetector = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle');
  const initialHash = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const getPageHash = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(window.location.origin + '/?_cache_bust=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
      });
      return res.headers.get('etag') || res.headers.get('last-modified') || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const hash = await getPageHash();
      if (mounted) initialHash.current = hash;
    };
    init();

    intervalRef.current = setInterval(async () => {
      if (!initialHash.current) return;
      const newHash = await getPageHash();
      if (newHash && newHash !== initialHash.current && mounted) {
        setUpdateAvailable(true);
        clearInterval(intervalRef.current);
      }
    }, CHECK_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, [getPageHash]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (updateAvailable) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [updateAvailable]);

  const handleUpdate = useCallback(() => {
    setIsUpdating(true);
    setPhase('loading');
    setProgress(0);

    const stages = [
      { target: 15, duration: 400 },
      { target: 35, duration: 600 },
      { target: 55, duration: 800 },
      { target: 72, duration: 1000 },
      { target: 88, duration: 700 },
      { target: 96, duration: 500 },
      { target: 100, duration: 300 },
    ];

    let delay = 0;
    stages.forEach((stage) => {
      delay += stage.duration;
      setTimeout(() => setProgress(stage.target), delay);
    });

    setTimeout(() => {
      setPhase('ready');
      setTimeout(() => window.location.reload(), 800);
    }, delay + 400);
  }, []);

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="w-full max-w-sm bg-card border border-primary/20 rounded-3xl shadow-[0_20px_60px_hsl(var(--primary)/0.25)] overflow-hidden"
          >
            {!isUpdating ? (
              <div className="p-6">
                {/* Hero icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Rocket className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                </div>

                <h2 className="text-center text-lg font-display font-bold mb-2">
                  Nouvelle mise à jour disponible !
                </h2>
                <p className="text-center text-sm text-muted-foreground mb-4 leading-relaxed">
                  Une nouvelle version du site est prête avec des améliorations et corrections importantes.
                </p>

                <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    👉 Clique sur <strong>« Mettre à jour »</strong> puis patiente quelques secondes le temps du chargement.
                  </p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2.5 mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Cette mise à jour est <strong>obligatoire</strong> pour éviter les bugs et conflits. Elle est requise pour continuer à utiliser le site.
                  </span>
                </div>

                <Button
                  onClick={handleUpdate}
                  size="lg"
                  className="w-full gap-2 h-12 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Mettre à jour
                </Button>

                <p className="text-center text-[10px] text-muted-foreground mt-3">
                  Merci pour ta compréhension 🙏
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex flex-col items-center gap-3 mb-5">
                  <motion.div
                    animate={{ rotate: phase === 'loading' ? 360 : 0 }}
                    transition={{ repeat: phase === 'loading' ? Infinity : 0, duration: 1, ease: 'linear' }}
                    className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
                  >
                    {phase === 'ready' ? (
                      <Sparkles className="w-7 h-7 text-primary" />
                    ) : (
                      <RefreshCw className="w-7 h-7 text-primary" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p className="text-base font-display font-bold">
                      {phase === 'ready' ? 'Mise à jour terminée !' : 'Mise à jour en cours…'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {phase === 'ready'
                        ? 'Rechargement automatique du site'
                        : 'Patiente quelques secondes, ne ferme pas la page'}
                    </p>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Progress value={progress} className="h-3 bg-secondary/50" />
                  {phase === 'loading' && progress < 100 && (
                    <motion.div
                      className="absolute top-0 left-0 h-full w-16 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-64px', '320px'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    />
                  )}
                </div>
                <p className="text-right text-xs font-display font-bold text-primary tabular-nums">
                  {progress}%
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateDetector;
