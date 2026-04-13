import { ArrowLeft, Users, Search, Image, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import MuteButton from '../MuteButton';
import MembersList from '../MembersList';

interface GroupChatHeaderProps {
  roomId: string;
  regionCode: string;
  regionName: string;
  memberCount: number;
  isCustomGroup?: boolean;
  typingUsers: any[];
  showMembers: boolean;
  setShowMembers: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  onBack: () => void;
  onShowMediaGallery: () => void;
  onShowSettings: () => void;
  onStartPrivateChat: (userId: string) => void;
}

const GroupChatHeader = ({
  roomId,
  regionCode,
  regionName,
  memberCount,
  isCustomGroup,
  typingUsers,
  showMembers,
  setShowMembers,
  searchOpen,
  setSearchOpen,
  onBack,
  onShowMediaGallery,
  onShowSettings,
  onStartPrivateChat,
}: GroupChatHeaderProps) => {
  return (
    <header className="flex-shrink-0 flex items-center gap-2.5 px-2 py-2.5 bg-card/95 backdrop-blur-lg border-b border-border/60 sticky top-0 z-20 shadow-[0_1px_3px_hsl(220_30%_20%/0.04)]">
      <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0 rounded-full hover:bg-secondary">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-primary-foreground text-sm flex-shrink-0 shadow-sm">
        {isCustomGroup ? regionName.charAt(0).toUpperCase() : regionCode}
      </div>
      
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-foreground truncate text-[15px] leading-tight font-body">
          {isCustomGroup ? regionName : `${regionName} (${regionCode})`}
        </h1>
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span>{memberCount} membres</span>
          {typingUsers.length > 0 && (
            <span className="text-primary font-medium animate-pulse truncate">• écrit…</span>
          )}
        </div>
      </div>

      <MuteButton conversationId={roomId} />

      <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} className="rounded-full hover:bg-secondary">
        <Search className="w-5 h-5" />
      </Button>
      
      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
            <Users className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-80">
          <div className="flex items-center justify-between p-4 border-b border-border/60">
            <h2 className="font-semibold text-[15px]">Membres</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowMembers(false)} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <MembersList
              regionCode={regionCode}
              onStartPrivateChat={(userId) => {
                setShowMembers(false);
                onStartPrivateChat(userId);
              }}
              isCustomGroup={isCustomGroup}
              roomId={roomId}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Button variant="ghost" size="icon" onClick={onShowMediaGallery} className="rounded-full hover:bg-secondary">
        <Image className="w-5 h-5" />
      </Button>

      {isCustomGroup && (
        <Button variant="ghost" size="icon" onClick={onShowSettings} className="rounded-full hover:bg-secondary">
          <Settings className="w-5 h-5" />
        </Button>
      )}
    </header>
  );
};

export default GroupChatHeader;
