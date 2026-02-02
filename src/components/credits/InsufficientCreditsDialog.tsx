import { Coins, ShoppingCart, Gift } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/hooks/useCredits';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits: number;
  actionName: string;
}

const InsufficientCreditsDialog = ({
  open,
  onOpenChange,
  requiredCredits,
  actionName,
}: InsufficientCreditsDialogProps) => {
  const { totalCredits, canClaimDaily } = useCredits();
  const missing = requiredCredits - totalCredits;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Crédits insuffisants
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Cette action ({actionName}) coûte <strong>{requiredCredits} crédit{requiredCredits > 1 ? 's' : ''}</strong>.
            </p>
            <p>
              Vous avez actuellement <strong>{totalCredits.toFixed(1)} crédits</strong>. 
              Il vous manque <strong className="text-red-500">{missing.toFixed(1)} crédits</strong>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {canClaimDaily && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/?tab=credits';
              }}
            >
              <Gift className="w-4 h-4 mr-2 text-green-500" />
              Réclamer mes crédits quotidiens
            </Button>
          )}
          <Button
            className="w-full justify-start bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
            onClick={() => {
              onOpenChange(false);
              window.location.href = '/?tab=credits';
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Acheter des crédits
          </Button>
          <AlertDialogCancel className="w-full">Annuler</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InsufficientCreditsDialog;
