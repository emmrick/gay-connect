import { MapPin, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useChatRooms } from '@/hooks/useChatRooms';

interface RegionSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const RegionSelect = ({ value, onChange, error }: RegionSelectProps) => {
  const { data: rooms, isLoading } = useChatRooms();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="region" className="text-sm text-muted-foreground">Région</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <select
          id="region"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-10 h-11 rounded-xl appearance-none cursor-pointer text-sm",
            "bg-secondary/50 border border-border/50 text-foreground",
            "focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring",
            "transition-colors",
            !value && "text-muted-foreground",
            error && "border-destructive ring-destructive"
          )}
        >
          <option value="">Choisis ta région</option>
          {isLoading ? (
            <option disabled>Chargement...</option>
          ) : (
            rooms?.map((room) => (
              <option key={room.id} value={room.region_code}>
                {room.region_code} - {room.region_name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default RegionSelect;
