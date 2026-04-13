import { Gift, Info, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SendGiftSection = () => {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-pink-500/15 bg-pink-500/5 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5 text-pink-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">Offrir des crédits</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          1 à 5 crédits bonus via une conversation privée 🎁
        </p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1.5 hover:bg-muted rounded-xl transition-colors shrink-0">
            <Info className="w-4 h-4 text-muted-foreground/50" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs max-w-52">
          Pour offrir des crédits, ouvrez une conversation privée et utilisez le bouton cadeau 🎁 dans la barre de saisie. Max 10 cadeaux/jour.
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SendGiftSection;
