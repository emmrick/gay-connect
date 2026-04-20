import * as React from 'react';

/**
 * Returns true on tablet viewports (768px - 1023px).
 * Useful to opt into denser desktop layouts on iPad-class devices
 * while keeping the sidebar collapsed by default.
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const onChange = () => setIsTablet(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isTablet;
}
