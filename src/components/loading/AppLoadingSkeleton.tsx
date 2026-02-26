import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppLoadingSkeleton = () => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const retryTimer = setTimeout(() => setShowRetry(true), 6000);
    return () => clearTimeout(retryTimer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="w-9 h-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-4 py-4 space-y-5">
        {showRetry && (
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <WifiOff className="w-4 h-4 text-destructive" />
              <span className="text-sm">Connexion difficile...</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
          </div>
        )}

        {/* Quick buttons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t border-border/50">
        <div className="flex items-center justify-around h-full px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-12 h-2.5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppLoadingSkeleton;