import { MessageCircle, Send, Phone, Mail, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ReferralShareTemplatesProps {
  link: string;
  reward: number;
  onNativeShare: () => void;
}

const buildTemplates = (link: string, reward: number) => ([
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    text: `Hey ! 👋 Je suis sur Gay Social, une appli de rencontres gay vraiment bien faite. Inscris-toi avec mon lien et on gagne ${reward} crédits gratuits chacun 🎁\n\n${link}`,
    href: (msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: Send,
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
    text: `Salut ! 💬 Rejoins-moi sur Gay Social — appli de rencontres gay sympa et safe. Avec mon lien, on reçoit ${reward} crédits gratuits chacun 🚀\n\n${link}`,
    href: (msg: string) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: Phone,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
    text: `Coucou ! Inscris-toi sur Gay Social avec mon lien, on a ${reward} crédits gratuits chacun : ${link}`,
    href: (msg: string) => `sms:?&body=${encodeURIComponent(msg)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    text: `Hello,\n\nJ'utilise Gay Social, une appli de rencontres gay franchement bien faite (vérification d'identité, vrais profils, modération sérieuse).\n\nSi tu t'inscris avec mon lien, on reçoit ${reward} crédits gratuits chacun après ta vérification :\n${link}\n\nÀ très vite !`,
    href: (msg: string) => `mailto:?subject=${encodeURIComponent('Rejoins-moi sur Gay Social')}&body=${encodeURIComponent(msg)}`,
  },
]);

const ReferralShareTemplates = ({ link, reward, onNativeShare }: ReferralShareTemplatesProps) => {
  const templates = buildTemplates(link, reward);

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copié, prêt à coller !');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Messages prêts à envoyer
        </h4>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onNativeShare}>
            Partage natif
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {templates.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`rounded-xl border p-3 transition-colors ${t.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px] flex-1"
                  onClick={() => copyTemplate(t.text)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copier
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 text-[10px] flex-1 bg-foreground text-background hover:bg-foreground/90"
                  asChild
                >
                  <a href={t.href(t.text)} target="_blank" rel="noopener noreferrer">
                    Envoyer
                  </a>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReferralShareTemplates;
