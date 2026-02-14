import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
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
  Loader2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';
import { useClearAllNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'verification_request':
    case 'verification_approved':
    case 'verification_submitted':
      return <ShieldCheck className="w-5 h-5 text-green-500" />;
    case 'verification_rejected':
      return <AlertTriangle className="w-5 h-5 text-destructive" />;
    case 'message':
    case 'private_message':
    case 'group_mention':
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    case 'profile_reaction':
    case 'favorite_added':
      return <Heart className="w-5 h-5 text-pink-500" />;
    case 'swipe_match':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'album_shared':
    case 'album_share_stopped':
    case 'album_share_expired':
    case 'album_share_ended':
      return <FolderOpen className="w-5 h-5 text-amber-500" />;
    case 'credits_approved':
      return <Gift className="w-5 h-5 text-green-500" />;
    case 'credits_rejected':
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'account_suspended':
    case 'account_banned':
      return <AlertTriangle className="w-5 h-5 text-destructive" />;
    case 'account_unblocked':
      return <ShieldCheck className="w-5 h-5 text-green-500" />;
    case 'welcome':
      return <Gift className="w-5 h-5 text-purple-500" />;
    case 'subscription_activated':
    case 'subscription_ended':
      return <Crown className="w-5 h-5 text-amber-500" />;
    default:
      return <Info className="w-5 h-5 text-muted-foreground" />;
  }
};

const getNotificationCategory = (type: string): string => {
  if (['verification_request', 'verification_approved', 'verification_rejected', 'verification_submitted'].includes(type)) {
    return 'verification';
  }
  if (['message', 'private_message', 'mention', 'group_mention'].includes(type)) {
    return 'messages';
  }
  if (['profile_reaction', 'favorite_added', 'swipe_match'].includes(type)) {
    return 'social';
  }
  if (['album_shared', 'album_share_stopped', 'album_share_expired', 'album_share_ended'].includes(type)) {
    return 'albums';
  }
  if (['credits_approved', 'credits_rejected'].includes(type)) {
    return 'credits';
  }
  if (['account_suspended', 'account_banned', 'account_unblocked', 'report_investigation'].includes(type)) {
    return 'account';
  }
  return 'other';
};

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string | null) => void;
}

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: NotificationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer group",
        !notification.is_read 
          ? "bg-primary/5 border-primary/20 hover:border-primary/40" 
          : "bg-card hover:bg-muted/50 border-border"
      )}
      onClick={() => {
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }
        onNavigate(notification.action_url);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          !notification.is_read ? "bg-primary/10" : "bg-muted"
        )}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "font-medium text-sm",
              !notification.is_read && "text-foreground"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            )}
          </div>
          
          {notification.message && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {notification.message}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationsHistoryPage = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAllNotifications = useClearAllNotifications();
  const navigate = useNavigate();

  const handleNavigate = (url: string | null) => {
    if (url) {
      navigate(url);
    }
  };

  const filteredNotifications = notifications?.filter(n => 
    filter === 'all' ? true : !n.is_read
  ) || [];

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return "Aujourd'hui";
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Hier';
    }
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-4 py-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Notifications</h1>
          <p className="text-center text-muted-foreground">
            {unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
          </p>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* Actions Bar */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              {/* Filter */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-auto">
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs px-3">
                    Toutes
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      {notifications?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs px-3">
                    Non lues
                    {(unreadCount ?? 0) > 0 && (
                      <Badge variant="destructive" className="ml-1.5 h-5 px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {(unreadCount ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs gap-1.5"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                  >
                    {markAllAsRead.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                    Tout marquer lu
                  </Button>
                )}

                {(notifications?.length ?? 0) > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                        Effacer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Effacer toutes les notifications ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action supprimera définitivement toutes vos notifications. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => clearAllNotifications.mutate()}
                        >
                          Effacer tout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medium mb-1">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'Toutes vos notifications ont été lues' 
                  : 'Vous n\'avez pas encore reçu de notifications'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedNotifications)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, notifs]) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-medium text-muted-foreground capitalize px-1">
                      {formatDateHeader(date)}
                    </h3>
                    <div className="space-y-2">
                      {notifs.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={(id) => markAsRead.mutate(id)}
                          onDelete={(id) => deleteNotification.mutate(id)}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsHistoryPage;