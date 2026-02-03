import { useState } from 'react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useOnlineMemberCounts } from '@/hooks/useOnlineMemberCounts';
import { useJoinedGroups } from '@/hooks/useJoinedGroups';
import { useCredits, CREDIT_COSTS } from '@/hooks/useCredits';
import { useCreditDialog } from '@/contexts/CreditDialogContext';
import { Search, X, MapPin, Users, Check, Loader2, AlertCircle, Home, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupJoined: (regionCode: string) => void;
}

const GroupPickerDialog = ({ open, onOpenChange, onGroupJoined }: GroupPickerDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const { data: rooms, isLoading } = useChatRooms();
  const { data: onlineCounts } = useOnlineMemberCounts();
  const { joinGroup, isJoined, isHomeGroup, canJoinMore, remainingSlots, maxGroups, homeRegionCode } = useJoinedGroups();
  const { hasEnoughCredits } = useCredits();
  const { showInsufficientCreditsDialog } = useCreditDialog();

  const filteredRegions = rooms?.filter(room =>
    room.region_code.includes(searchQuery) ||
    room.region_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Sort: home group first, then alphabetically
  const sortedRegions = [...filteredRegions].sort((a, b) => {
    if (a.region_code === homeRegionCode) return -1;
    if (b.region_code === homeRegionCode) return 1;
    return a.region_name.localeCompare(b.region_name);
  });

  const handleJoinGroup = async (regionCode: string, regionName: string) => {
    if (!canJoinMore && !isJoined(regionCode)) {
      toast.error(`Tu es limité à ${maxGroups} groupes !`, {
        description: 'Quitte un groupe pour en rejoindre un autre.',
      });
      return;
    }

    // Check if this requires credits
    const requiresCredits = !isHomeGroup(regionCode);
    
    if (requiresCredits && !hasEnoughCredits(CREDIT_COSTS.join_extra_group)) {
      showInsufficientCreditsDialog(CREDIT_COSTS.join_extra_group, 'Rejoindre un groupe');
      return;
    }

    setJoiningGroup(regionCode);

    const result = await joinGroup(regionCode, regionName);
    
    setJoiningGroup(null);

    if (result.success) {
      const message = requiresCredits 
        ? `Groupe ${regionName} rejoint pour ${CREDIT_COSTS.join_extra_group} crédits !`
        : `Groupe ${regionName} rejoint !`;
      toast.success(message);
      onGroupJoined(regionCode);
      onOpenChange(false);
    } else if (result.reason === 'insufficient_credits') {
      showInsufficientCreditsDialog(CREDIT_COSTS.join_extra_group, 'Rejoindre un groupe');
    } else if (result.reason === 'max_limit') {
      toast.error(`Tu es limité à ${maxGroups} groupes !`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Rejoindre un groupe
          </DialogTitle>
          <DialogDescription>
            Ton groupe régional est gratuit. Les autres coûtent {CREDIT_COSTS.join_extra_group} crédits.
          </DialogDescription>
        </DialogHeader>

        {/* Limit warning */}
        {!canJoinMore && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Limite atteinte</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Tu es limité à {maxGroups} groupes. Quitte un groupe pour en rejoindre un autre.
              </p>
            </div>
          </div>
        )}

        {/* Remaining slots */}
        {canJoinMore && (
          <div className="mx-6 mb-4 text-sm text-muted-foreground">
            {remainingSlots} place{remainingSlots > 1 ? 's' : ''} restante{remainingSlots > 1 ? 's' : ''} sur {maxGroups}
          </div>
        )}

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par code ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 bg-secondary/50 border-border/50 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Regions list */}
        <ScrollArea className="flex-1 max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sortedRegions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune région trouvée</p>
            </div>
          ) : (
            <div className="px-4 pb-6 space-y-1">
              {sortedRegions.map((room) => {
                const onlineCount = onlineCounts?.[room.region_code] || 0;
                const joined = isJoined(room.region_code);
                const isHome = isHomeGroup(room.region_code);
                const isJoining = joiningGroup === room.region_code;

                return (
                  <button
                    key={room.id}
                    onClick={() => handleJoinGroup(room.region_code, room.region_name)}
                    disabled={joined || isJoining}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                      "hover:bg-secondary",
                      joined && "bg-primary/10 cursor-default",
                      isHome && !joined && "bg-green-500/10 border border-green-500/30"
                    )}
                  >
                    {/* Region code */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs relative",
                      joined
                        ? "bg-primary text-primary-foreground"
                        : isHome
                        ? "bg-green-500 text-white"
                        : "bg-gradient-to-br from-primary/80 to-accent/80 text-white"
                    )}>
                      {room.region_code}
                      {isHome && (
                        <Home className="w-3 h-3 absolute -top-1 -right-1 text-green-500 bg-background rounded-full p-0.5" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {room.region_name}
                        </h3>
                        {isHome && !joined && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                            Gratuit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>
                          {onlineCount > 0 ? (
                            <span className="text-green-500">{onlineCount} en ligne</span>
                          ) : (
                            'Aucun en ligne'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    {isJoining ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : joined ? (
                      <div className="flex items-center gap-1 text-primary text-xs font-medium">
                        <Check className="w-4 h-4" />
                        Rejoint
                      </div>
                    ) : (
                      <Button size="sm" variant={isHome ? "default" : "secondary"} className="h-7 text-xs gap-1">
                        {!isHome && <Coins className="w-3 h-3" />}
                        {isHome ? 'Rejoindre' : `${CREDIT_COSTS.join_extra_group}`}
                      </Button>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GroupPickerDialog;
