import { useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { id: 'how', q: 'Comment fonctionne le système ?', a: 'Chaque action consomme des crédits. 15 crédits à l\'inscription, 5 gratuits chaque jour. Ordre de consommation : Quotidiens → Passif → Bonus → Achetés.' },
  { id: 'daily', q: 'Les crédits quotidiens ?', a: '5 crédits rechargés chaque jour à minuit. Non cumulables : si vous avez encore 3 crédits quotidiens, seuls 2 seront ajoutés.' },
  { id: 'passive', q: 'Comment fonctionne le crédit passif ?', a: 'Vous gagnez des crédits automatiquement à intervalles réguliers, jusqu\'à un plafond maximum. Le montant, l\'intervalle et le plafond peuvent varier selon les promotions en cours. Consultez la section "Répartition" pour voir les valeurs actuelles. Aucune action requise.' },
  { id: 'passive-promo', q: 'Comment savoir si la recharge passive est en promotion ?', a: 'Quand l\'intervalle de recharge est réduit ou le montant augmenté, un bandeau orange 🔥 "Recharge passive boostée" apparaît sur la page Crédits et la carte Passif affiche un badge "Promo". Les valeurs actuelles vs normales sont affichées.' },
  { id: 'lock', q: 'Pourquoi verrouiller des crédits ?', a: 'Le verrouillage empêche la consommation d\'un type de crédit. Utile pour économiser vos crédits achetés et n\'utiliser que les quotidiens.' },
  { id: 'expiry', q: 'Expiration des crédits ?', a: 'Les crédits achetés et bonus n\'expirent jamais. Seuls les quotidiens sont remplacés chaque jour.' },
  { id: 'prices', q: 'Pourquoi ces prix bas ?', a: 'Tarifs de lancement valables 1 an. Les prix définitifs seront plus élevés. Tous les tarifs sont dynamiques et peuvent changer à tout moment.' },
  { id: 'dynamic', q: 'Les tarifs peuvent-ils changer ?', a: 'Oui, tous les coûts d\'actions sont dynamiques. Les administrateurs peuvent ajuster les tarifs en temps réel. Vous êtes notifié automatiquement de tout changement. Les promotions (tarif réduit ou action gratuite) sont signalées par des badges visuels.' },
  { id: 'referral', q: 'Le parrainage ?', a: 'Partagez votre code. Quand votre filleul vérifie son identité, vous recevez tous les deux des crédits bonus.' },
  { id: 'gift', q: 'Comment offrir des crédits ?', a: 'Vous pouvez offrir entre 1 et 5 crédits bonus à un autre membre, jusqu\'à 10 fois par jour.' },
  { id: 'security', q: 'Mes crédits sont-ils protégés ?', a: 'Oui. Les modifications de solde passent exclusivement par des fonctions sécurisées côté serveur. Aucune manipulation directe n\'est possible depuis le navigateur.' },
];

const CreditFAQSection = () => {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? faqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-heading font-semibold">Questions fréquentes</h2>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 text-xs rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus-visible:border-primary/40"
        />
      </div>

      <Accordion type="single" collapsible className="space-y-1.5">
        {filtered.map(faq => (
          <AccordionItem key={faq.id} value={faq.id} className="border rounded-2xl overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm">
            <AccordionTrigger className="text-[13px] font-medium px-4 py-3 hover:no-underline hover:bg-muted/20">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-[12px] text-muted-foreground px-4 pb-3 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default CreditFAQSection;
