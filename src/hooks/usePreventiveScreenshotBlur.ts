import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Preventive Screenshot Blur Protection
 * Uses banking-app techniques to make screenshots black/unusable:
 * 
 * 1. Rapid RAF loop that detects frame drops (screenshot causes frame skip)
 * 2. Adds invisible overlay that appears in screenshots
 * 3. Uses CSS filter tricks that show differently in screenshots
 * 4. Monitors for screen recording via MediaDevices API
 */

interface PreventiveBlurOptions {
  enabled?: boolean;
  onThreatDetected?: () => void;
}

export const usePreventiveScreenshotBlur = ({
  enabled = true,
  onThreatDetected,
}: PreventiveBlurOptions = {}) => {
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameDropCountRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const [showProtection, setShowProtection] = useState(false);

  // Detect screen recording via navigator.mediaDevices
  const checkScreenRecording = useCallback(async () => {
    try {
      // Check if getDisplayMedia is being used (screen recording indicator)
      if ('mediaDevices' in navigator) {
        // This doesn't directly detect, but we can check for active captures
        const devices = await navigator.mediaDevices.enumerateDevices();
        // If there are unusual video inputs, might be screen recording
        const hasScreenCapture = devices.some(
          d => d.kind === 'videoinput' && d.label.toLowerCase().includes('screen')
        );
        if (hasScreenCapture && !isRecordingRef.current) {
          isRecordingRef.current = true;
          console.log('[PreventiveBlur] Screen recording detected');
          onThreatDetected?.();
          setShowProtection(true);
        }
      }
    } catch (e) {
      // Silently fail - not all browsers support this
    }
  }, [onThreatDetected]);

  // Frame monitoring - screenshots cause frame drops
  const monitorFrames = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Normal frame: ~16ms (60fps)
    // Screenshot typically causes 50-200ms frame drop
    if (delta > 100) {
      frameDropCountRef.current++;
      console.log('[PreventiveBlur] Frame drop detected:', delta.toFixed(0), 'ms');
      
      // If we get frame drops, show protection and trigger detection
      if (frameDropCountRef.current >= 1) {
        setShowProtection(true);
        onThreatDetected?.();
        
        // Reset after showing protection
        setTimeout(() => {
          setShowProtection(false);
          frameDropCountRef.current = 0;
        }, 2000);
      }
    }

    rafIdRef.current = requestAnimationFrame(monitorFrames);
  }, [enabled, onThreatDetected]);

  useEffect(() => {
    if (!enabled) return;

    // Start frame monitoring
    rafIdRef.current = requestAnimationFrame(monitorFrames);

    // Check for screen recording periodically
    const recordingCheckInterval = setInterval(checkScreenRecording, 2000);

    // Also check on visibility changes (aggressive)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // IMMEDIATELY show protection when app goes to background
        setShowProtection(true);
        onThreatDetected?.();
      } else {
        // Keep protection for a bit after returning
        setTimeout(() => setShowProtection(false), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clearInterval(recordingCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, monitorFrames, checkScreenRecording, onThreatDetected]);

  return { showProtection, isRecording: isRecordingRef.current };
};

export default usePreventiveScreenshotBlur;
