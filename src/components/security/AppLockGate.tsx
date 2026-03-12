import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppLock } from '@/hooks/useAppLock';
import PinLockScreen from './PinLockScreen';
import PinSetupScreen from './PinSetupScreen';

const AppLockGate = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    isLocked,
    hasPin,
    isLoading,
    verifyPin,
    setupPin,
    unlockWithBiometric,
    enableBiometric,
    isBiometricAvailable,
    biometricEnabled,
  } = useAppLock();

  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricSupported);
  }, [isBiometricAvailable]);

  // Not authenticated or still loading
  if (!user || authLoading || isLoading) return <>{children}</>;

  // User has no PIN yet → show setup
  if (hasPin === false) {
    return (
      <>
        {children}
        <PinSetupScreen
          onSetup={setupPin}
          onEnableBiometric={enableBiometric}
          isBiometricAvailable={isBiometricAvailable}
        />
      </>
    );
  }

  // User has PIN and app is locked → show lock screen
  if (isLocked && hasPin) {
    return (
      <PinLockScreen
        onUnlock={verifyPin}
        onBiometricUnlock={unlockWithBiometric}
        biometricAvailable={biometricSupported}
        biometricEnabled={biometricEnabled}
      />
    );
  }

  return <>{children}</>;
};

export default AppLockGate;
