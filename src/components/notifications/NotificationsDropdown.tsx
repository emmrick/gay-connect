import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Info,
  Heart,
  FolderOpen,
  Gift,
  Crown,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationsHistoryPage from './NotificationsHistoryPage';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'verification_request':
    case 'verification_approved':
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    case 'verification_rejected':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'message':
    case 'private_message':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'profile_reaction':
    case 'favorite_added':
      return <Heart className="w-4 h-4 text-pink-500" />;
    case 'album_shared':
    case 'album_share_stopped':
      return <FolderOpen className="w-4 h-4 text-amber-500" />;
    case 'welcome':
      return <Gift className="w-4 h-4 text-purple-500" />;
    case 'subscription_activated':
    case 'subscription_ended':
      return <Crown className="w-4 h-4 text-amber-500" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string | null) => void;
}) => {
  return (
    <div
      className={`p-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer group ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
      onClick={() => {
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }
        onNavigate(notification.action_url);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{notification.title}</p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleNavigate = (url: string | null) => {
    if (url) {
      navigate(url);
      setOpen(false);
      setShowFullHistory(false);
    }
  };

  const recentNotifications = notifications?.slice(0, 5) || [];

  // Full history sheet for mobile
  if (showFullHistory) {
    return (
      <Sheet open={showFullHistory} onOpenChange={setShowFullHistory}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {(unreadCount ?? 0) > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <NotificationsHistoryPage />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {(unreadCount ?? 0) > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="w-3 h-3" />
                Tout lire
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-72">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chargement...
              </div>
            ) : !recentNotifications?.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucune notification
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={(id) => markAsRead.mutate(id)}
                  onDelete={(id) => deleteNotification.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </ScrollArea>

          {/* View all button */}
          {(notifications?.length ?? 0) > 0 && (
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={() => {
                  setOpen(false);
                  setShowFullHistory(true);
                }}
              >
                <History className="w-3 h-3" />
                Voir tout l'historique ({notifications?.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Full history sheet */}
      <Sheet open={showFullHistory} onOpenChange={setShowFullHistory}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
          <NotificationsHistoryPage />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NotificationsDropdown;
