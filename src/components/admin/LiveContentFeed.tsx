/**
 * Flux temps réel des contenus pour les modérateurs.
 *
 * Sources surveillées (Realtime INSERT) :
 *  - messages privés (`messages` is_private=true)
 *  - messages de groupe (`messages` is_private=false, chat_room_id ≠ null)
 *  - tweens (`tweens`)
 *  - médias éphémères / snaps (`ephemeral_media`)
 *
 * Permission requise : admin OU `can_manage_content`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pause,
  Play,
  Trash2,
  ExternalLink,
  MessageSquare,
  Users2,
  Megaphone,
  Camera,
  Activity,
  Filter,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------

export type LiveItemSource = 'private' | 'group' | 'tween' | 'snap';

interface LiveItem {
  id: string;
  source: LiveItemSource;
  user_id: string;
  username?: string | null;
  avatar_url?: string | null;
  content?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  /** Lien éventuel vers le contexte (conversation, tween) */
  context_url?: string;
  /** Identifiants techniques pour suppression */
  table: 'messages' | 'tweens' | 'ephemeral_media';
}

const SOURCE_META: Record<
  LiveItemSource,
  { label: string; icon: typeof MessageSquare; color: string }
> = {
  private: {
    label: 'Privé',
    icon: MessageSquare,
    color: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  group: {
    label: 'Groupe',
    icon: Users2,
    color: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  },
  tween: {
    label: 'Tween',
    icon: Megaphone,
    color: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  },
  snap: {
    label: 'Snap',
    icon: Camera,
    color: 'bg-pink-500/15 text-pink-600 border-pink-500/30',
  },
};

const MAX_ITEMS = 200;

// ---------------------------------------------------------------------------

const fetchUserMini = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
};

// ---------------------------------------------------------------------------

const LiveContentFeed = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<LiveItem[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [filters, setFilters] = useState<Record<LiveItemSource, boolean>>({
    private: true,
    group: true,
    tween: true,
    snap: true,
  });
  const [keyword, setKeyword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<LiveItem | null>(null);

  // Compteurs sur la dernière minute pour le débit
  const recentRef = useRef<number[]>([]);
  const [rate, setRate] = useState(0);

  const pushItem = async (raw: Omit<LiveItem, 'username' | 'avatar_url'>) => {
    if (pausedRef.current) return;
    if (!filters[raw.source]) return;

    const profile = await fetchUserMini(raw.user_id);
    const item: LiveItem = {
      ...raw,
      username: profile?.username,
      avatar_url: profile?.avatar_url,
    };

    setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
    recentRef.current.push(Date.now());
  };

  // Compteur live (rafraîchi chaque seconde)
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - 60_000;
      recentRef.current = recentRef.current.filter((t) => t > cutoff);
      setRate(recentRef.current.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Abonnement Realtime
  useEffect(() => {
    const channel = supabase
      .channel('mod-live-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as any;
          if (m.deleted_at) return;
          const isPrivate = m.is_private === true;
          pushItem({
            id: m.id,
            source: isPrivate ? 'private' : 'group',
            user_id: m.sender_id,
            content: m.content ?? null,
            media_type: m.message_type !== 'text' ? m.message_type : null,
            created_at: m.created_at,
            context_url: isPrivate
              ? `/messages/${m.recipient_id}`
              : m.chat_room_id
                ? `/chat/${m.chat_room_id}`
                : undefined,
            table: 'messages',
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweens' },
        (payload) => {
          const t = payload.new as any;
          pushItem({
            id: t.id,
            source: 'tween',
            user_id: t.user_id,
            content: t.content ?? null,
            media_url: t.media_url ?? null,
            media_type: t.media_type ?? null,
            created_at: t.created_at,
            context_url: '/tween',
            table: 'tweens',
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ephemeral_media' },
        async (payload) => {
          const e = payload.new as any;
          // récupérer le sender via la message liée
          const { data: msg } = await supabase
            .from('messages')
            .select('sender_id, recipient_id')
            .eq('id', e.message_id)
            .maybeSingle();
          if (!msg) return;
          pushItem({
            id: e.id,
            source: 'snap',
            user_id: msg.sender_id,
            media_url: e.media_url,
            media_type: e.media_type,
            created_at: e.created_at,
            context_url: msg.recipient_id ? `/messages/${msg.recipient_id}` : undefined,
            table: 'ephemeral_media',
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((it) => {
      if (!filters[it.source]) return false;
      if (kw) {
        const hay = `${it.content ?? ''} ${it.username ?? ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, filters, keyword]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const it = confirmDelete;
    setConfirmDelete(null);
    try {
      if (it.table === 'messages') {
        const { error } = await supabase
          .from('messages')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: (await supabase.auth.getUser()).data.user?.id ?? null,
          })
          .eq('id', it.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(it.table).delete().eq('id', it.id);
        if (error) throw error;
      }
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      qc.invalidateQueries({ queryKey: ['admin-content-moderation'] });
      toast.success('Contenu supprimé');
    } catch (e: any) {
      toast.error(e?.message ?? 'Suppression impossible');
    }
  };

  const toggleSource = (s: LiveItemSource) =>
    setFilters((p) => ({ ...p, [s]: !p[s] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={cn(
                      'absolute inline-flex h-full w-full rounded-full opacity-75',
                      paused ? 'bg-muted' : 'animate-ping bg-red-500',
                    )}
                  />
                  <span
                    className={cn(
                      'relative inline-flex rounded-full h-2.5 w-2.5',
                      paused ? 'bg-muted-foreground' : 'bg-red-500',
                    )}
                  />
                </span>
                Surveillance en direct
              </CardTitle>
              <CardDescription>
                {paused ? 'Flux en pause' : 'Flux temps réel'} ·{' '}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  {rate}/min
                </span>
                {' · '}
                {filteredItems.length} affichés
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={paused ? 'default' : 'outline'}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? (
                  <>
                    <Play className="w-4 h-4 mr-1.5" />
                    Reprendre
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1.5" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItems([])}
                disabled={items.length === 0}
              >
                <Eraser className="w-4 h-4 mr-1.5" />
                Vider
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(Object.keys(SOURCE_META) as LiveItemSource[]).map((s) => {
              const meta = SOURCE_META[s];
              const Icon = meta.icon;
              const active = filters[s];
              return (
                <Button
                  key={s}
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  className="h-8"
                  onClick={() => toggleSource(s)}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {meta.label}
                </Button>
              );
            })}
          </div>
          <Input
            placeholder="Filtrer par mot-clé ou pseudo…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Feed */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100dvh-380px)] min-h-[400px]">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                {paused
                  ? 'Flux en pause. Cliquez sur Reprendre.'
                  : 'En attente de nouveaux contenus…'}
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                <AnimatePresence initial={false}>
                  {filteredItems.map((it) => {
                    const meta = SOURCE_META[it.source];
                    const Icon = meta.icon;
                    return (
                      <motion.li
                        key={`${it.table}-${it.id}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.18 }}
                        className="p-3 flex gap-3 hover:bg-muted/30"
                      >
                        <div className="shrink-0">
                          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold uppercase">
                            {it.username?.[0] ?? '?'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn('gap-1 text-[10px]', meta.color)}
                            >
                              <Icon className="w-3 h-3" />
                              {meta.label}
                            </Badge>
                            <span className="font-medium text-sm truncate">
                              {it.username ?? it.user_id.slice(0, 8)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {formatDistanceToNow(new Date(it.created_at), { locale: fr, addSuffix: true })}
                            </span>
                          </div>
                          {it.content && (
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words line-clamp-3">
                              {it.content}
                            </p>
                          )}
                          {it.media_type && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              📎 {it.media_type}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {it.context_url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => window.open(it.context_url, '_blank')}
                              title="Ouvrir le contexte"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(it)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est immédiate. Le contenu sera marqué comme supprimé
              et l'utilisateur ne le verra plus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LiveContentFeed;
