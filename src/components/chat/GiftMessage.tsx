import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiftMessageProps {
  amount: number;
  senderName: string;
  recipientName: string;
  isOwn: boolean;
}

const GiftMessage = ({ amount, senderName, recipientName, isOwn }: GiftMessageProps) => {
  return (
    <div className={cn(
      "rounded-2xl px-4 py-3 max-w-[280px]",
      "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
      "border border-amber-500/30"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Cadeau ! 🎁
        </span>
      </div>
      <p className="text-sm text-foreground">
        {isOwn ? 'Tu as' : <><span className="font-medium">{senderName}</span> a</>} offert{' '}
        <span className="font-bold text-amber-600 dark:text-amber-400">{amount} crédit{amount > 1 ? 's' : ''}</span>
        {isOwn ? ` à ${recipientName}` : ' !'}
      </p>
    </div>
  );
};

export default GiftMessage;
