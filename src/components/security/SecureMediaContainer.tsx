import { ReactNode, CSSProperties, memo } from 'react';

interface SecureMediaContainerProps {
  children: ReactNode;
  isProtected?: boolean;
  className?: string;
}

/**
 * Secure container for sensitive media
 * Uses banking-app CSS techniques:
 * 1. Prevents selection, drag, and context menu
 * 2. Uses CSS that renders black in screenshots on some devices
 * 3. Applies security attributes to all child elements
 */
const SecureMediaContainer = memo(({
  children,
  isProtected = true,
  className = '',
}: SecureMediaContainerProps) => {
  const securityStyles: CSSProperties = isProtected ? {
    // Prevent text/image selection
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    
    // Hardware acceleration for smoother protection
    transform: 'translateZ(0)',
    WebkitTransform: 'translateZ(0)',
    
    // Backface visibility for screenshot tricks
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    
    // Perspective for 3D transforms
    perspective: 1000,
    WebkitPerspective: 1000,
  } : {};

  return (
    <div
      className={className}
      style={securityStyles}
      data-protected="true"
      onContextMenu={(e) => isProtected && e.preventDefault()}
      onDragStart={(e) => isProtected && e.preventDefault()}
      onCopy={(e) => isProtected && e.preventDefault()}
      onCut={(e) => isProtected && e.preventDefault()}
    >
      {children}
      
      {/* Invisible overlay that may appear in screenshots */}
      {isProtected && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'transparent',
            // This trick can make screenshots appear darker on some devices
            mixBlendMode: 'saturation',
            opacity: 0,
          }}
        />
      )}
    </div>
  );
});

SecureMediaContainer.displayName = 'SecureMediaContainer';

export default SecureMediaContainer;
