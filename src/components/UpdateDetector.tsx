import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, AlertTriangle, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const CHECK_INTERVAL = 30_000; // 30s
const DISMISS_KEY = 'update-detector-dismissed-hash';

const UpdateDetector = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [latestHash, setLatestHash] = useState<string | null>(null);
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
        // Don't re-show if user already dismissed this exact version
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed === newHash) return;
        setLatestHash(newHash);
        setUpdateAvailable(true);
        clearInterval(intervalRef.current);
      }
    }, CHECK_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, [getPageHash]);

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

  const handleDismiss = useCallback(() => {
    if (latestHash) localStorage.setItem(DISMISS_KEY, latestHash);
    setUpdateAvailable(false);
  }, [latestHash]);

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 top-0 z-[9999]"
        >
          <div className="bg-card/95 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_24px_hsl(var(--primary)/0.15)]">
            <div className="max-w-lg mx-auto px-4 py-3">
              {!isUpdating ? (
                <>
                  {/* Notification mode */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🚀</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold mb-0.5">
                        Nouvelle mise à jour disponible !
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Une nouvelle version est prête avec des améliorations et corrections importantes.
                      </p>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="p-1 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
                      aria-label="Fermer"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Recommandée pour éviter les bugs et conflits.</span>
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    <Button
                      onClick={handleUpdate}
                      size="sm"
                      className="flex-1 gap-1.5 h-9"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Mettre à jour
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="ghost"
                      className="h-9"
                    >
                      Plus tard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Loading mode */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <motion.div
                      animate={{ rotate: phase === 'loading' ? 360 : 0 }}
                      transition={{ repeat: phase === 'loading' ? Infinity : 0, duration: 1, ease: 'linear' }}
                      className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                    >
                      {phase === 'ready' ? (
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-semibold">
                        {phase === 'ready' ? 'Mise à jour terminée !' : 'Mise à jour en cours…'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {phase === 'ready' ? 'Rechargement automatique' : 'Patiente quelques secondes…'}
                      </p>
                    </div>
                    <span className="text-xs font-display font-bold text-primary tabular-nums">
                      {progress}%
                    </span>
                  </div>

                  <div className="relative">
                    <Progress value={progress} className="h-2 bg-secondary/50" />
                    {phase === 'loading' && progress < 100 && (
                      <motion.div
                        className="absolute top-0 left-0 h-full w-16 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-64px', '300px'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateDetector;
