/**
 * Horizontal stories-like row showing contacts with a pending Selfie/snap.
 * Sourced from `usePendingEphemeralSnaps` so it stays in sync with the chat list.
 * Tapping a story navigates to the conversation with `openSnap` enabled.
 */
import { motion } from 'framer-motion';
import { Camera, Video } from 'lucide-react';
import { usePrivateConversations } from '@/hooks/usePrivateConversations';
import { usePendingEphemeralSnaps } from '@/hooks/usePendingEphemeralSnaps';
import { cn } from '@/lib/utils';

interface MessagesStoriesRowProps {
  onSelectSnap: (userId: string) => void;
}

const MessagesStoriesRow = ({ onSelectSnap }: MessagesStoriesRowProps) => {
  const { conversations } = usePrivateConversations();
  const { data: pendingSnaps } = usePendingEphemeralSnaps();

  if (!pendingSnaps || pendingSnaps.size === 0) return null;

  const items = conversations
    .map((conv) => {
      const snap = pendingSnaps.get(conv.otherUser.user_id);
      if (!snap) return null;
      return { conv, snap };
    })
    .filter(Boolean) as { conv: typeof conversations[number]; snap: { mediaType: string } }[];

  if (items.length === 0) return null;

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Selfies en attente
        </h3>
        <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none">
        {items.map(({ conv, snap }, index) => {
          const isPhoto = snap.mediaType === 'image';
          const ringColor = isPhoto ? 'ring-teal-500' : 'ring-orange-500';
          const Icon = isPhoto ? Camera : Video;
          const iconColor = isPhoto ? 'bg-teal-500' : 'bg-orange-500';

          return (
            <motion.button
              key={conv.id}
              onClick={() => onSelectSnap(conv.otherUser.user_id)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.94 }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
            >
              <div className="relative">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-background',
                    ringColor
                  )}
                >
                  {conv.otherUser.avatar_url ? (
                    <img
                      src={conv.otherUser.avatar_url}
                      alt={conv.otherUser.username}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                      {conv.otherUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md',
                    iconColor
                  )}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
              </div>
              <span className="text-[11px] font-medium text-foreground truncate max-w-full leading-tight">
                {conv.otherUser.username}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesStoriesRow;
