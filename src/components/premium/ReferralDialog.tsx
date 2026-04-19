import { useState } from 'react';
import { Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ReferralSection from './ReferralSection';

const ReferralDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-primary/10"
          aria-label="Ouvrir le parrainage"
        >
          <Users className="w-5 h-5 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shadow-sm">
            <Gift className="w-2 h-2 text-white" />
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[88vh] rounded-t-3xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/40 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base font-heading">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-primary flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-white" />
            </div>
            Parrainage
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">
          <ReferralSection />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReferralDialog;

