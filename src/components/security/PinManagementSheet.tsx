import { useState, useCallback, useEffect } from 'react';
import { Lock, Fingerprint, KeyRound, Check, Delete } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppLock } from '@/hooks/useAppLock';

interface PinManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PinStep = 'menu' | 'verify-old' | 'enter-new' | 'confirm-new';

const PinManagementSheet = ({ open, onOpenChange }: PinManagementSheetProps) => {
  const {
    verifyPin,
    setupPin,
    enableBiometric,
    disableBiometric,
    isBiometricAvailable,
    biometricEnabled,
  } = useAppLock();

  const [step, setStep] = useState<PinStep>('menu');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBioSupported);
  }, [isBiometricAvailable]);

  useEffect(() => {
    if (!open) {
      setStep('menu');
      setCurrentPin('');
      setNewPin('');
      setError(false);
    }
  }, [open]);

  const handleDigit = useCallback((digit: string) => {
    if (currentPin.length >= 6 || isProcessing) return;
    const pin = currentPin + digit;
    setCurrentPin(pin);
    setError(false);

    if (pin.length === 6) {
      if (step === 'verify-old') {
        setIsProcessing(true);
        // Just verify without unlocking (re-use verifyPin but we need to check hash)
        verifyPin(pin).then(success => {
          if (success) {
            setCurrentPin('');
            setStep('enter-new');
          } else {
            setError(true);
            setTimeout(() => { setCurrentPin(''); setError(false); }, 600);
            toast.error('Code PIN incorrect');
          }
          setIsProcessing(false);
        });
      } else if (step === 'enter-new') {
        setNewPin(pin);
        setCurrentPin('');
        setStep('confirm-new');
      } else if (step === 'confirm-new') {
        if (pin === newPin) {
          setIsProcessing(true);
          setupPin(pin).then(success => {
            if (success) {
              toast.success('Code PIN modifié avec succès !');
              onOpenChange(false);
            } else {
              toast.error('Erreur lors du changement');
            }
            setIsProcessing(false);
          });
        } else {
          setError(true);
          setTimeout(() => {
            setCurrentPin('');
            setNewPin('');
            setStep('enter-new');
            setError(false);
            toast.error('Les codes ne correspondent pas');
          }, 600);
        }
      }
    }
  }, [currentPin, step, newPin, isProcessing, verifyPin, setupPin, onOpenChange]);

  const handleDelete = useCallback(() => {
    if (isProcessing) return;
    setCurrentPin(prev => prev.slice(0, -1));
    setError(false);
  }, [isProcessing]);

  const handleToggleBiometric = async () => {
    if (!biometricEnabled) {
      const success = await enableBiometric();
      if (success) {
        toast.success('Empreinte digitale activée !');
      } else {
        toast.error("Impossible d'activer l'empreinte digitale");
      }
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const renderPinPad = (title: string, subtitle: string) => (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <KeyRound className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground text-center">{subtitle}</p>

      <motion.div
        className="flex gap-3 my-3"
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
              error
                ? 'bg-destructive border-destructive'
                : i < currentPin.length
                  ? 'bg-primary border-primary scale-110'
                  : 'border-muted-foreground/40 bg-transparent'
            }`}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === 'del') {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="h-14 rounded-2xl flex items-center justify-center text-foreground active:bg-secondary transition-colors"
              >
                <Delete className="w-5 h-5" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-secondary/60 text-foreground text-xl font-semibold active:bg-secondary transition-colors hover:bg-secondary/80"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Sécurité & Code PIN
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-20">
          {step === 'menu' && (
            <div className="space-y-4">
              {/* Change PIN */}
              <button
                onClick={() => setStep('verify-old')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium block">Modifier le code PIN</span>
                  <span className="text-sm text-muted-foreground">Changer ton code à 6 chiffres</span>
                </div>
              </button>

              {/* Biometric toggle */}
              {bioSupported && (
                <>
                  <Separator />
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="font-medium block">Empreinte digitale</Label>
                      <p className="text-sm text-muted-foreground">
                        {biometricEnabled ? 'Activée — déverrouillage rapide' : 'Déverrouiller sans code PIN'}
                      </p>
                    </div>
                    <Switch
                      checked={biometricEnabled}
                      onCheckedChange={handleToggleBiometric}
                    />
                  </div>
                </>
              )}

              {/* Info */}
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">Protection active</p>
                    <p className="text-muted-foreground mt-1">
                      Ton code PIN est demandé à chaque ouverture de l'application pour protéger ton compte.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'verify-old' && renderPinPad('Code actuel', 'Saisis ton code PIN actuel')}
          {step === 'enter-new' && renderPinPad('Nouveau code PIN', 'Choisis un nouveau code à 6 chiffres')}
          {step === 'confirm-new' && renderPinPad('Confirmer', 'Saisis à nouveau le nouveau code')}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PinManagementSheet;
