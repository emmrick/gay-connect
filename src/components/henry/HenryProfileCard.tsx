import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, SkipForward, Sparkles, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { usePrivateConversations } from '@/hooks/usePrivateConversations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { buildIntroSuggestions } from '@/lib/henry/henryFlow';
import type { HenryProfileMatch } from '@/hooks/useHenryChat';

interface Props {
  profile: HenryProfileMatch;
  interests: string[];
  onSkip: () => void;
}

const HenryProfileCard = ({ profile, interests, onSkip }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrCreateConversation } = usePrivateConversations();
  const [introOpen, setIntroOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const suggestions = buildIntroSuggestions(
    profile.username,
    profile.shared_tribes,
    interests,
  );

  const handleSendIntro = async (text: string) => {
    if (!user) return;
    setSending(true);
    try {
      const conv = await getOrCreateConversation.mutateAsync(profile.user_id);
      // Insert the first message
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: profile.user_id,
        conversation_id: conv.id,
        content: text,
        message_type: 'text',
        is_private: true,
      } as any);
      if (error) throw error;
      toast.success(`Message envoyé à ${profile.username} 💌`);
      setIntroOpen(false);
      navigate(`/messages/${profile.user_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-sm w-full"
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
          <div className="relative aspect-[4/5] bg-muted">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Heart className="w-12 h-12 opacity-30" />
              </div>
            )}
            {/* Compatibility badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground border-0 shadow-md gap-1">
                <Sparkles className="w-3 h-3" />
                {profile.compatibility}% compat.
              </Badge>
            </div>
            {profile.is_online && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/80 backdrop-blur px-2 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En ligne
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {profile.username}
                {profile.age != null && (
                  <span className="text-muted-foreground font-normal">
                    , {profile.age}
                  </span>
                )}
              </h3>
              {profile.region && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {profile.region}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-foreground/80 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {profile.reasons.length > 0 && (
              <ul className="space-y-1">
                {profile.reasons.slice(0, 3).map((r, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="text-primary mt-0.5">✓</span> {r}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => setIntroOpen(true)}
                className="flex-1 gap-1.5"
                size="sm"
              >
                <MessageCircle className="w-4 h-4" /> Envoyer un message
              </Button>
              <Button
                onClick={onSkip}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <SkipForward className="w-4 h-4" /> Suivant
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>💬 Brise la glace avec {profile.username}</DialogTitle>
            <DialogDescription>
              Henry te propose quelques messages d'intro. Choisis-en un ou écris
              le tien depuis la conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                disabled={sending}
                onClick={() => handleSendIntro(s)}
                className="w-full text-left text-sm bg-muted hover:bg-muted/70 rounded-lg p-3 transition disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={sending}
            onClick={async () => {
              if (!user) return;
              setSending(true);
              try {
                await getOrCreateConversation.mutateAsync(profile.user_id);
                navigate(`/messages/${profile.user_id}`);
              } catch (err: any) {
                toast.error(err?.message || 'Ouverture impossible');
              } finally {
                setSending(false);
              }
            }}
          >
            Ouvrir la conversation sans message pré-rempli
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HenryProfileCard;
