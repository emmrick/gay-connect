import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyMessage {
  id: string;
  content: string;
  senderName: string;
}

interface MessageReplyProps {
  replyTo: ReplyMessage;
  onCancelReply: () => void;
}

const MessageReply = ({ replyTo, onCancelReply }: MessageReplyProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-l-4 border-primary animate-fade-in">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary truncate">
          Réponse à {replyTo.senderName}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {replyTo.content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onCancelReply}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MessageReply;
