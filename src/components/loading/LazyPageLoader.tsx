import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyPageLoaderProps {
  children: ReactNode;
}

// Minimal fallback for lazy loaded components - no framer-motion overhead
export const PageFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[200px]">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const LazyPageLoader = ({ children }: LazyPageLoaderProps) => {
  return (
    <Suspense fallback={<PageFallback />}>
      {children}
    </Suspense>
  );
};

export default LazyPageLoader;
