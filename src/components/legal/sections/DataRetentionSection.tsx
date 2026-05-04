import { Trash2, Shield } from 'lucide-react';
import LegalSection from '../LegalSection';

const DataRetentionSection = () => (
  <LegalSection
    id="data-retention"
    value="data-retention"
    title="Politique de conservation & suppression des données"
    icon={Trash2}
    iconBgClassName="bg-amber-500/20"
    iconClassName="text-amber-500"
  >
    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
      <p className="font-semibold text-amber-700 dark:text-amber-400">
        🔒 Transparence totale — Gay Social applique une politique stricte de conservation
        limitée des données, conformément au principe de minimisation du RGPD (art. 5.1.e).
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Durée maximale de conservation</h4>
      <p className="mb-3">
        Nous ne conservons aucune donnée personnelle au-delà de <strong className="text-foreground">2 ans</strong>.
        Passé ce délai, les données sont automatiquement et définitivement supprimées de nos serveurs.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-semibold text-foreground">Type de données</th>
              <th className="text-left py-2 font-semibold text-foreground">Durée de conservation</th>
            </tr>
          </thead>
          <tbody className="space-y-1">
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Documents d'identité (vérification)</td><td className="py-2"><strong>72 heures maximum</strong></td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Médias éphémères consultés</td><td className="py-2"><strong>Supprimés immédiatement</strong> après visionnage</td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Médias éphémères non consultés</td><td className="py-2">90 jours maximum</td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Notifications lues</td><td className="py-2">6 mois (180 jours)</td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Historique des transactions de crédits</td><td className="py-2">1 an (365 jours) — audit financier</td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Messages, événements de sécurité, logs</td><td className="py-2"><strong>2 ans maximum</strong></td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Actions de modération &amp; revenus modérateurs</td><td className="py-2"><strong>2 ans maximum</strong></td></tr>
            <tr className="border-b border-border/50"><td className="py-2 pr-4">Fichiers orphelins (stockage)</td><td className="py-2">90 jours</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Suppression automatique des comptes anciens (5 ans d'inactivité)</h4>
      <p>
        Tout compte dont la <strong className="text-foreground">dernière connexion</strong> remonte à plus de
        <strong className="text-foreground"> 5 ans</strong> est automatiquement et définitivement supprimé,
        ainsi que l'intégralité des données associées. <strong className="text-foreground">Chaque connexion
        repousse automatiquement cette échéance de 5 ans.</strong>
      </p>
      <p className="mt-2 text-sm">
        Des notifications de rappel sont envoyées à 90, 30 et 7 jours avant la suppression,
        invitant l'utilisateur à se reconnecter pour conserver son compte.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Suppression pour inactivité prolongée (2 ans)</h4>
      <p>
        Tout compte inactif depuis plus de <strong className="text-foreground">2 ans</strong> (aucune connexion)
        est automatiquement supprimé. Des notifications de rappel sont envoyées à 90, 30 et 7 jours
        avant la suppression.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Nettoyage automatique hebdomadaire</h4>
      <p>Un processus automatisé s'exécute chaque semaine pour supprimer :</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>Les médias éphémères consultés et les fichiers orphelins de plus de 90 jours</li>
        <li>Les notifications lues de plus de 6 mois</li>
        <li>L'historique des transactions de crédits de plus d'1 an</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Suppression configurable par l'utilisateur</h4>
      <p>
        Chaque utilisateur peut configurer la suppression automatique de ses messages privés
        selon ses préférences : immédiatement après lecture, après 24h, 7 jours, 30 jours,
        90 jours, ou conservation indéfinie (dans la limite de 2 ans).
      </p>
      <p className="mt-2 text-sm">
        <strong>Note :</strong> Cette suppression est uniquement côté client (affichage). Les données
        restent accessibles aux modérateurs en cas d'enquête sur une infraction.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">6. Suppression définitive du compte</h4>
      <p>
        Lorsqu'un utilisateur supprime son compte, <strong className="text-foreground">toutes</strong> ses
        données sont définitivement et irréversiblement effacées de tous nos serveurs :
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>Profil, photos, albums et tous les médias stockés</li>
        <li>Messages privés et de groupe</li>
        <li>Historique de crédits et transactions</li>
        <li>Favoris, réactions, préférences et paramètres</li>
        <li>Signalements, actions de modération et logs associés</li>
        <li>Compte d'authentification</li>
      </ul>
      <p className="mt-2 text-sm">
        Aucune donnée n'est conservée après la suppression du compte. Cette action est irréversible.
      </p>
    </div>

    <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        7. Exception : enquête en cours
      </h4>
      <p className="text-sm">
        En cas d'infraction avérée ou d'enquête judiciaire en cours, les données pertinentes
        peuvent être conservées au-delà des durées indiquées, conformément à nos obligations
        légales (art. 6.1.c RGPD). L'utilisateur concerné en est informé par une notification
        « Infraction en cours » sur son compte.
      </p>
    </div>
  </LegalSection>
);

export default DataRetentionSection;
