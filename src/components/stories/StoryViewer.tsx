import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Trash2, Globe, MapPin, Lock, Shield } from 'lucide-react';
import { useStories, StoryGroup, Story } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenshotProtection } from '@/hooks/useScreenshotProtection';
import ScreenshotProtectionOverlay from '@/components/security/ScreenshotProtectionOverlay';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
  onNextGroup: () => void;
}

const STORY_DURATION = 5; // 5 seconds per story

const StoryViewer = ({ group, onClose, onNextGroup }: StoryViewerProps) => {
  const { user } = useAuth();
  const { viewStory, reportScreenshot, deleteStory } = useStories();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNotifiedScreenshot = useRef(false);

  const {
    isBlocked,
    preventContextMenu,
    handleViolation: baseHandleViolation,
    enableProtection,
    disableProtection,
  } = useScreenshotProtection(true, true);

  const currentStory = group.stories[currentIndex];
  const isOwn = currentStory?.user_id === user?.id;

  // Wrap violation to notify
  const handleViolation = useCallback(() => {
    baseHandleViolation();
    if (!hasNotifiedScreenshot.current && currentStory) {
      hasNotifiedScreenshot.current = true;
      reportScreenshot.mutate(currentStory.id);
    }
  }, [baseHandleViolation, currentStory, reportScreenshot]);

  // Enable protection
  useEffect(() => {
    enableProtection();
    return () => { disableProtection(); };
  }, [enableProtection, disableProtection]);

  // Mark as viewed
  useEffect(() => {
    if (currentStory && !isOwn && !currentStory.has_viewed) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory, isOwn, viewStory]);

  // Progress timer
  useEffect(() => {
    if (isPaused || isClosing) return;

    const interval = 50; // Update every 50ms
    const step = (interval / (STORY_DURATION * 1000)) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Next story or next group
          if (currentIndex < group.stories.length - 1) {
            setCurrentIndex(i => i + 1);
            hasNotifiedScreenshot.current = false;
            return 0;
          } else {
            onNextGroup();
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPaused, isClosing, currentIndex, group.stories.length, onNextGroup]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Tap navigation
  const handleTap = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 3;

    if (isLeftSide) {
      // Previous story
      if (currentIndex > 0) {
        setCurrentIndex(i => i - 1);
        hasNotifiedScreenshot.current = false;
      }
    } else {
      // Next story
      if (currentIndex < group.stories.length - 1) {
        setCurrentIndex(i => i + 1);
        hasNotifiedScreenshot.current = false;
      } else {
        onNextGroup();
      }
    }
  }, [currentIndex, group.stories.length, onNextGroup]);

  // Hold to pause
  const handlePointerDown = useCallback(() => {
    holdTimerRef.current = setTimeout(() => setIsPaused(true), 200);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsPaused(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    if (!currentStory) return;
    await deleteStory.mutateAsync(currentStory.id);
    if (group.stories.length <= 1) {
      handleClose();
    } else if (currentIndex >= group.stories.length - 1) {
      setCurrentIndex(i => Math.max(0, i - 1));
    }
  }, [currentStory, deleteStory, group.stories.length, currentIndex, handleClose]);

  const visibilityIcon = currentStory?.visibility === 'regional' ? MapPin 
    : currentStory?.visibility === 'private' ? Lock : Globe;
  const VisIcon = visibilityIcon;

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black select-none"
        onContextMenu={preventContextMenu}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        {/* Screenshot protection overlay */}
        <ScreenshotProtectionOverlay isActive={isBlocked} />

        {/* Segmented progress bars */}
        <div className="absolute top-2 left-3 right-3 z-20 flex gap-1">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/20">
              <div
                className="h-full bg-white rounded-full transition-all ease-linear"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  transitionDuration: i === currentIndex ? '50ms' : '0ms',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 pt-4 px-4 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                {group.avatar_url ? (
                  <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">
                    {group.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">{group.username}</span>
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <VisIcon className="w-3 h-3" />
                  {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwn && (
                <>
                  <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-white/20 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media content - tap areas */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleTap}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: isPaused ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center"
            style={{
              filter: isBlocked ? 'brightness(0)' : 'none',
              transition: 'filter 0.1s ease',
            }}
          >
            {currentStory.media_type === 'image' ? (
              <img
                src={currentStory.signedUrl}
                alt="Story"
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            ) : (
              <video
                src={currentStory.signedUrl}
                className="max-w-full max-h-full object-contain"
                autoPlay
                playsInline
                muted={false}
              />
            )}
          </motion.div>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-16 left-0 right-0 px-6 z-20">
            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-3 max-w-md mx-auto">
              <p className="text-white text-sm text-center">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute bottom-8 left-0 right-0 text-center z-20">
            <span className="text-white/40 text-xs">⏸ En pause</span>
          </div>
        )}

        {/* Screenshot warning */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <p className="text-white/30 text-xs flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Protégé contre les captures
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
