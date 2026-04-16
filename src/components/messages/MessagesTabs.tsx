import { Users, Archive, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MessagesTabsProps {
  value: 'conversations' | 'groups' | 'archived';
  onValueChange: (value: string) => void;
  unreadCount: number;
  archivedCount: number;
  groupsCount: number;
}

const Badge = ({ count, active }: { count: number; active: boolean }) => {
  if (!count) return null;
  return (
    <span
      className={cn(
        'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const MessagesTabs = ({
  value,
  onValueChange,
  unreadCount,
  archivedCount,
  groupsCount,
}: MessagesTabsProps) => {
  return (
    <div className="px-5 pb-3">
      <Tabs value={value} onValueChange={onValueChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations" className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
            <Badge count={unreadCount} active={value === 'conversations'} />
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Groupes</span>
            <Badge count={groupsCount} active={value === 'groups'} />
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" />
            <span>Archives</span>
            <Badge count={archivedCount} active={value === 'archived'} />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default MessagesTabs;
