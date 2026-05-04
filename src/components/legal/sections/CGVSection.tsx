import { CreditCard } from 'lucide-react';
import LegalSection from '../LegalSection';

const CGVSection = () => (
  <LegalSection id="cgv" value="cgv" title="Système de crédits & CGV" icon={CreditCard}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">Monétisation du site</h4>
      <p>
        Gay Social fonctionne avec un système de crédits. Les crédits permettent
        d'utiliser les différentes fonctionnalités de la plateforme et servent à
        financer le développement et la maintenance du service.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Comment obtenir des crédits</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Crédits offerts à l'inscription</strong> : 15 crédits de bienvenue</li>
        <li><strong>Vérification d'identité</strong> : 30 crédits bonus</li>
        <li><strong>Parrainage</strong> : 10 crédits pour le parrain et le filleul (après vérification)</li>
        <li><strong>Crédits quotidiens</strong> : 5 crédits/jour (max 7 jours/mois)</li>
        <li><strong>Achat</strong> : 100 crédits pour 5,99 € via Revolut</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Coût des fonctionnalités</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Message texte : 0.1 crédit</li>
        <li>Photo/Vidéo simple : 0.2 crédit</li>
        <li>Média éphémère : 0.5 crédit</li>
        <li>Partage d'album : 1.0 crédit</li>
        <li>Création d'album : 10.0 crédits</li>
        <li>Réaction sur profil : 0.3 crédit</li>
        <li>Consultation de profil : 0.1 crédit</li>
        <li>Création de message enregistré : 1er gratuit, puis progressif (5, 10, 15... crédits)</li>
        <li>Modification de message enregistré : 2.0 crédits</li>
      </ul>
      <p className="font-medium text-foreground mt-3 mb-2">Fonctionnalité Swipe :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Aimer un profil (swipe droite) : 0.5 crédit</li>
        <li>Passer un profil (swipe gauche) : 0.2 crédit - le profil revient après 3 mois</li>
        <li>Masquer définitivement (swipe haut) : 0.1 crédit</li>
      </ul>
    </div>

    <div className="bg-muted/50 rounded-xl p-4">
      <h4 className="font-semibold text-foreground mb-2">⚠️ Ce que les crédits ne garantissent PAS</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Une rencontre garantie</li>
        <li>Des réponses aux messages</li>
        <li>Un quelconque rapport sexuel</li>
      </ul>
      <p className="mt-2 text-sm">
        Les crédits permettent d'utiliser les fonctionnalités de la plateforme mais
        ne garantissent aucun résultat en termes de rencontres.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Remboursements</h4>
      <p>
        Conformément à l'article L221-28 du Code de la consommation, le droit de
        rétractation ne s'applique pas aux services de contenu numérique.
        Aucun remboursement ne sera effectué pour les crédits achetés ou utilisés.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Validité des crédits</h4>
      <p>
        Les crédits quotidiens ne sont pas cumulables et doivent être réclamés chaque jour.
        Les crédits achetés et bonus n'ont pas de date d'expiration tant que le compte reste actif.
        En cas de suspension ou de suppression de compte, les crédits restants sont perdus sans remboursement.
      </p>
    </div>
  </LegalSection>
);

export default CGVSection;
