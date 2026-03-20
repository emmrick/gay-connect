import { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Lock, Delete, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface PinLockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
  onBiometricUnlock: () => Promise<boolean>;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
}

const PinLockScreen = ({ onUnlock, onBiometricUnlock, biometricAvailable, biometricEnabled }: PinLockScreenProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [successUnlock, setSuccessUnlock] = useState(false);

  useEffect(() => {
    if (biometricAvailable && biometricEnabled) {
      handleBiometric();
    }
  }, [biometricAvailable, biometricEnabled]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 6 || isChecking) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 6) {
      setIsChecking(true);
      onUnlock(newPin).then(success => {
        if (!success) {
          setError(true);
          setAttempts(prev => prev + 1);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        } else {
          setSuccessUnlock(true);
        }
        setIsChecking(false);
      });
    }
  }, [pin, isChecking, onUnlock]);

  const handleDelete = useCallback(() => {
    if (isChecking) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, [isChecking]);

  const handleBiometric = useCallback(async () => {
    setIsChecking(true);
    const success = await onBiometricUnlock();
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 600);
    } else {
      setSuccessUnlock(true);
    }
    setIsChecking(false);
  }, [onBiometricUnlock]);

  const handleLogout = async () => {
    localStorage.removeItem('gc_session_expiry_days');
    await supabase.auth.signOut();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, hsl(220 70% 12%) 0%, hsl(230 60% 8%) 50%, hsl(240 50% 5%) 100%)',
      }}
    >
      {/* Subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
      />

      {/* Top section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center pt-20 gap-5"
      >
        {/* Lock icon with ring */}
        <motion.div
          animate={error ? { scale: [1, 0.9, 1] } : successUnlock ? { scale: [1, 1.2, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)',
              border: '1.5px solid hsl(var(--primary) / 0.25)',
            }}
          >
            <Lock className="w-8 h-8" style={{ color: 'hsl(var(--primary) / 0.8)' }} />
          </div>
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid hsl(var(--primary) / 0.2)' }}
          />
        </motion.div>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-white/90 text-lg font-semibold tracking-wide">
            Entrer le code PIN
          </h1>
          <AnimatePresence>
            {attempts >= 3 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400/80 text-xs"
              >
                {attempts} tentatives échouées
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* PIN dots */}
        <motion.div
          className="flex gap-4"
          animate={error ? { x: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              animate={
                error
                  ? { scale: 1 }
                  : i < pin.length
                    ? { scale: [0.8, 1.15, 1] }
                    : { scale: 1 }
              }
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                    : i < pin.length
                      ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                      : 'bg-white/10 border border-white/15'
                }`}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Numpad */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 pb-10 w-full max-w-[320px] px-6"
      >
        <div className="grid grid-cols-3 gap-4 w-full">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />;
            if (d === 'del') {
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className="aspect-square rounded-2xl flex items-center justify-center text-white/50 active:text-white/80 transition-colors"
                >
                  <Delete className="w-6 h-6" />
                </motion.button>
              );
            }
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92, backgroundColor: 'rgba(255,255,255,0.12)' }}
                onClick={() => handleDigit(d)}
                className="aspect-square rounded-2xl flex items-center justify-center text-white text-2xl font-medium transition-all duration-150"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {d}
              </motion.button>
            );
          })}
        </div>

        {/* Biometric + Logout */}
        <div className="flex flex-col items-center gap-3 mt-2">
          {biometricAvailable && biometricEnabled && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBiometric}
              disabled={isChecking}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.05) 100%)',
                border: '1px solid hsl(var(--primary) / 0.2)',
              }}
            >
              <Fingerprint className="w-5 h-5" style={{ color: 'hsl(var(--primary) / 0.7)' }} />
              <span className="text-sm text-white/60">Empreinte digitale</span>
            </motion.button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/25 hover:text-white/40 text-xs transition-colors mt-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PinLockScreen;
