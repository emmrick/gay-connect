import { useState, useEffect, useCallback } from 'react';
import { Gift, Loader2, CheckCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ReferralCodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ReferralCodeInput = ({ value, onChange }: ReferralCodeInputProps) => {
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (code: string) => {
    if (!code.trim()) { setValidation(null); return; }
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-referrals', {
        body: { action: 'validate-code', referralCode: code.trim() }
      });
      setValidation(error ? { valid: false, message: 'Erreur de validation' } : data);
    } catch {
      setValidation({ valid: false, message: 'Erreur de validation' });
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    if (value.length >= 11) validate(value);
    else setValidation(null);
  }, [value, validate]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="referral" className="text-sm text-muted-foreground flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        Code de parrainage (optionnel)
      </Label>
      <div className="relative">
        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="referral"
          type="text"
          placeholder="GC-XXXXXXXX"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="pl-10 pr-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors uppercase"
        />
        {isValidating && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        {!isValidating && validation && (
          validation.valid
            ? <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            : <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
        )}
      </div>
      {validation && (
        <p className={cn("text-xs", validation.valid ? "text-green-600" : "text-destructive")}>
          {validation.message}
        </p>
      )}
    </div>
  );
};

export default ReferralCodeInput;
