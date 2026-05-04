import { ReactNode } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalSectionProps {
  id: string;
  value: string;
  title: string;
  icon: LucideIcon;
  iconBgClassName?: string;
  iconClassName?: string;
  children: ReactNode;
}

/** Shared accordion section wrapper used by every legal sub-section. */
const LegalSection = ({
  id,
  value,
  title,
  icon: Icon,
  iconBgClassName = 'bg-primary/20',
  iconClassName = 'text-primary',
  children,
}: LegalSectionProps) => (
  <AccordionItem
    id={id}
    value={value}
    className="glass-card rounded-2xl px-6 border-border bg-card"
  >
    <AccordionTrigger className="hover:no-underline">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            iconBgClassName
          )}
        >
          <Icon className={cn('w-5 h-5', iconClassName)} />
        </div>
        <span className="font-display font-semibold text-lg">{title}</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground space-y-4 pt-4">
      {children}
    </AccordionContent>
  </AccordionItem>
);

export default LegalSection;
