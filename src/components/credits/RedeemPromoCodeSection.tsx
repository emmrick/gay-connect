import { useState, useEffect } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const RedeemPromoCodeSection = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const queryClient = useQueryClient();

  // Auto-fill from sessionStorage (QR code scan)
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_promo_code');
    if (pending) {
      setCode(pending);
      sessionStorage.removeItem('pending_promo_code');
    }
  }, []);

  const handleRedeem = async () => {
    if (!code.trim() || !user) return;
    setIsRedeeming(true);

    try {
      const { data, error } = await supabase.rpc('redeem_flyer_promo_code', {
        _user_id: user.id,
        _code: code.trim(),
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; credits?: number; code?: string };

      if (result.success) {
        toast.success(`🎁 ${result.credits} crédits offerts avec le code ${result.code} !`);
        setCode('');
        queryClient.invalidateQueries({ queryKey: ['credits'] });
        queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      } else {
        toast.error(result.error || 'Code invalide');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation du code');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          Code promo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Entrer un code promo"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          />
          <Button onClick={handleRedeem} disabled={!code.trim() || isRedeeming} size="sm">
            {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tu as reçu un code promo ? Entre-le ici pour recevoir tes crédits gratuits !
        </p>
      </CardContent>
    </Card>
  );
};

export default RedeemPromoCodeSection;
