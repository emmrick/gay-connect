import { useState } from 'react';
import { Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SendGiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  onSendGift: (amount: number) => void;
  isSending?: boolean;
}

const AMOUNTS = [1, 2, 3, 4, 5];

const SendGiftDialog = ({ isOpen, onClose, recipientName, onSendGift, isSending }: SendGiftDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState(1);

  const handleSend = () => {
    onSendGift(selectedAmount);
    setSelectedAmount(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Envoyer un cadeau
          </DialogTitle>
          <DialogDescription>
            Offre des crédits bonus à {recipientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount selection */}
          <div className="flex items-center justify-center gap-3">
            {AMOUNTS.map(amount => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all",
                  "border-2 active:scale-95",
                  selectedAmount === amount
                    ? "border-primary bg-primary text-primary-foreground shadow-lg scale-110"
                    : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
                )}
              >
                {amount}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedAmount}</span> crédit{selectedAmount > 1 ? 's' : ''} sera{selectedAmount > 1 ? 'ont' : ''} déduit{selectedAmount > 1 ? 's' : ''} de ton solde
          </p>

          <Button
            onClick={handleSend}
            disabled={isSending}
            className="w-full"
          >
            {isSending ? 'Envoi...' : `🎁 Offrir ${selectedAmount} crédit${selectedAmount > 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendGiftDialog;
