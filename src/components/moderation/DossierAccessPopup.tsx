import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppLock } from '@/hooks/useAppLock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Loader2, Delete, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Real-time popup that appears when a moderator requests access to this user's dossier.
 * The user must confirm + enter their PIN to authorize access.
 */
const DossierAccessPopup = () => {
  const { user } = useAuth();
  const { verifyPin, hasPin } = useAppLock();
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [moderatorName, setModeratorName] = useState<string | null>(null);

  // Listen for incoming dossier access requests in real-time
  useEffect(() => {
    if (!user?.id) return;

    // Check for existing pending request on mount
    const checkExisting = async () => {
      const { data } = await supabase
        .from('dossier_access_requests' as any)
        .select('*')
        .eq('target_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setPendingRequest(data[0]);
        fetchModeratorName((data[0] as any).requester_id);
      }
    };
    checkExisting();

    const channel = supabase
      .channel(`dossier-access-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dossier_access_requests',
          filter: `target_user_id=eq.${user.id}`,
        },
        (payload) => {
          if ((payload.new as any).status === 'pending') {
            setPendingRequest(payload.new);
            fetchModeratorName((payload.new as any).requester_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchModeratorName = async (modId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', modId)
      .single();
    setModeratorName(data?.username || 'Un conseiller');
  };

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 6 || isChecking) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 6) {
      setIsChecking(true);
      verifyPin(newPin).then(async (success) => {
        if (success && pendingRequest) {
          // Approve access
          await supabase
            .from('dossier_access_requests' as any)
            .update({ status: 'approved', responded_at: new Date().toISOString() } as any)
            .eq('id', (pendingRequest as any).id);
          toast.success('Accès au dossier autorisé');
          setPendingRequest(null);
          setPin('');
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
        setIsChecking(false);
      });
    }
  }, [pin, isChecking, verifyPin, pendingRequest]);

  const handleDelete = useCallback(() => {
    if (isChecking) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, [isChecking]);

  const handleDeny = async () => {
    if (!pendingRequest) return;
    await supabase
      .from('dossier_access_requests' as any)
      .update({ status: 'denied', responded_at: new Date().toISOString() } as any)
      .eq('id', (pendingRequest as any).id);
    toast.info('Demande d\'accès refusée');
    setPendingRequest(null);
    setPin('');
  };

  if (!pendingRequest || !hasPin) return null;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <Dialog open={!!pendingRequest} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-primary" />
            Demande d'accès à votre dossier
          </DialogTitle>
          <DialogDescription className="text-sm">
            <strong>{moderatorName || 'Un conseiller'}</strong> du service client souhaite accéder à votre dossier.
            Pour autoriser l'accès, saisissez votre code PIN.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* PIN dots */}
          <motion.div
            className="flex gap-3"
            animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
                  error
                    ? 'bg-destructive border-destructive'
                    : i < pin.length
                      ? 'bg-primary border-primary scale-110'
                      : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </motion.div>

          {error && (
            <p className="text-xs text-destructive">Code incorrect, réessayez</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    className="h-12 rounded-xl flex items-center justify-center text-muted-foreground active:bg-secondary transition-colors"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  className="h-12 rounded-xl bg-secondary text-foreground text-lg font-semibold active:bg-secondary/70 transition-colors hover:bg-secondary/80"
                >
                  {d}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1.5 mt-2"
            onClick={handleDeny}
          >
            <X className="w-4 h-4" />
            Refuser l'accès
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DossierAccessPopup;
