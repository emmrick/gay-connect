import { useState, useCallback } from 'react';
import EphemeralMediaViewer from './EphemeralMediaViewer';

export interface EphemeralMediaItem {
  messageId: string;
  mediaId: string;
  type: 'image' | 'video';
  src: string;
  senderName: string;
  senderAvatar?: string | null;
  duration: number;
  isOwn: boolean;
  onViewed: () => void;
  onSaveToConversation?: () => Promise<void>;
  canReplay?: boolean;
  onReplay?: () => void;
  onScreenshotDetected?: () => void;
}

interface SequentialEphemeralViewerProps {
  isOpen: boolean;
  items: EphemeralMediaItem[];
  startIndex: number;
  onClose: () => void;
}

/**
 * Sequential viewer for ephemeral media - tap to advance to next media
 * Similar to Snapchat story viewing behavior
 */
const SequentialEphemeralViewer = ({
  isOpen,
  items,
  startIndex,
  onClose,
}: SequentialEphemeralViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Reset index when opening
  const effectiveIndex = Math.min(currentIndex, items.length - 1);
  const currentItem = items[effectiveIndex];

  // Track if we've advanced past the first item (auto-start subsequent ones)
  const isAutoStart = effectiveIndex > startIndex;

  const handleClose = useCallback(() => {
    // Advance to next media automatically
    const nextIndex = effectiveIndex + 1;
    if (nextIndex < items.length) {
      setCurrentIndex(nextIndex);
    } else {
      // No more media, close viewer
      setCurrentIndex(0);
      onClose();
    }
  }, [effectiveIndex, items.length, onClose]);

  const handleActualClose = useCallback(() => {
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  if (!isOpen || !currentItem) return null;

  return (
    <EphemeralMediaViewer
      key={currentItem.messageId} // Force remount for each media
      isOpen={isOpen}
      type={currentItem.type}
      src={currentItem.src}
      senderName={currentItem.senderName}
      senderAvatar={currentItem.senderAvatar}
      duration={currentItem.duration}
      mediaId={currentItem.mediaId}
      autoStart={isAutoStart}
      totalItems={items.length}
      currentItemIndex={effectiveIndex}
      onClose={handleClose}
      onViewed={currentItem.onViewed}
      onSaveToConversation={currentItem.onSaveToConversation}
      canReplay={currentItem.canReplay}
      onReplay={currentItem.onReplay}
      onScreenshotDetected={currentItem.onScreenshotDetected}
    />
  );
};

export default SequentialEphemeralViewer;
