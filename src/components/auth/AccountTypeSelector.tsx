import { User, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AccountTypeSelectorProps {
  value: 'solo' | 'couple';
  onChange: (value: 'solo' | 'couple') => void;
}

const AccountTypeSelector = ({ value, onChange }: AccountTypeSelectorProps) => (
  <div className="space-y-2">
    <Label className="text-sm text-muted-foreground">Type de compte</Label>
    <div className="grid grid-cols-2 gap-2">
      {[
        { key: 'solo' as const, icon: User, label: 'Je suis seul' },
        { key: 'couple' as const, icon: Users, label: 'Nous sommes un couple' },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            value === key
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/30"
          )}
        >
          <Icon className={cn("w-6 h-6", value === key ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", value === key ? "text-primary" : "text-muted-foreground")}>
            {label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default AccountTypeSelector;
