import { Lock, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LegalSection from '../LegalSection';

interface PrivacySectionProps {
  isAuthenticated: boolean;
  onExportData: () => void;
}

const PrivacySection = ({ isAuthenticated, onExportData }: PrivacySectionProps) => (
  <LegalSection id="privacy" value="privacy" title="Politique de confidentialité (RGPD)" icon={Lock}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Responsable du traitement</h4>
      <p>
        Le responsable du traitement des données est BAYART Emmrick, auto-entrepreneur,
        domicilié au 61 Rue de Lion, 75012 Paris, France (SIRET : 977 861 665 00015).
        Contact : <a href="mailto:pipaselfie@gmail.com" className="text-primary hover:underline">pipaselfie@gmail.com</a>.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Données collectées</h4>
      <p>Nous collectons les catégories de données suivantes :</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li><strong>Données d'identification</strong> : pseudo, âge, région, adresse email</li>
        <li><strong>Données de vérification</strong> : pièce d'identité et selfie (conservés max 72h, voir section dédiée)</li>
        <li><strong>Données de profil</strong> : photos, bio, préférences</li>
        <li><strong>Données de localisation</strong> : latitude/longitude (optionnel, avec consentement explicite)</li>
        <li><strong>Contenus échangés</strong> : messages texte, photos, vidéos, médias éphémères, messages vocaux</li>
        <li><strong>Données financières</strong> : historique de crédits, transactions, achats</li>
        <li><strong>Données techniques</strong> : adresse IP, user agent, horodatages de connexion, statut en ligne</li>
        <li><strong>Données de modération</strong> : signalements, infractions, sanctions, captures d'écran détectées</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Finalités du traitement</h4>
      <p>Vos données sont traitées pour les finalités suivantes :</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li><strong>Fonctionnement du service</strong> : mise en relation, messagerie, partage de contenus</li>
        <li><strong>Sécurité</strong> : vérification d'identité, détection des comportements abusifs, modération des contenus</li>
        <li><strong>Modération &amp; infractions</strong> : en cas d'infraction, l'historique des conversations et médias est analysé par nos modérateurs pour garantir la sécurité de la communauté</li>
        <li><strong>Anti-fraude</strong> : détection des faux profils, captures d'écran, comportements suspects</li>
        <li><strong>Obligations légales</strong> : réponse aux réquisitions judiciaires, conservation légale</li>
        <li><strong>Amélioration du service</strong> : statistiques anonymisées d'utilisation</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Base légale du traitement</h4>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li><strong>Exécution du contrat</strong> (art. 6.1.b RGPD) : fonctionnalités du service, système de crédits</li>
        <li><strong>Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurité de la plateforme, modération, anti-fraude</li>
        <li><strong>Consentement</strong> (art. 6.1.a RGPD) : géolocalisation, notifications push</li>
        <li><strong>Obligation légale</strong> (art. 6.1.c RGPD) : vérification de majorité, coopération judiciaire</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Protection des données</h4>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Chiffrement</strong> : toutes les données sont chiffrées en transit (TLS/HTTPS)
          et au repos sur nos serveurs sécurisés.
        </li>
        <li>
          <strong>Médias privés</strong> : tous les médias (photos, vidéos, albums) sont stockés
          dans des espaces privés et accessibles uniquement via des URLs temporaires signées.
        </li>
        <li>
          <strong>Médias éphémères</strong> : les contenus éphémères sont définitivement supprimés
          après consultation par le destinataire.
        </li>
        <li>
          <strong>Aucune vente de données</strong> : nous ne vendons, ne louons et ne partageons
          jamais vos données personnelles avec des tiers à des fins commerciales.
        </li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">6. Sous-traitants</h4>
      <p>
        Nos données sont hébergées sur des serveurs Lovable Cloud (infrastructure Supabase),
        conformes aux normes de sécurité européennes. Aucun autre sous-traitant n'a accès
        à vos données personnelles.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">7. Vos droits (RGPD)</h4>
      <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li><strong>Droit d'accès</strong> (art. 15) : consulter l'ensemble de vos données personnelles</li>
        <li><strong>Droit de rectification</strong> (art. 16) : corriger vos données inexactes</li>
        <li><strong>Droit à l'effacement</strong> (art. 17) : supprimer votre compte et toutes vos données</li>
        <li><strong>Droit à la portabilité</strong> (art. 20) : télécharger vos données au format structuré (ZIP/JSON)</li>
        <li><strong>Droit d'opposition</strong> (art. 21) : vous opposer au traitement de vos données</li>
        <li><strong>Droit à la limitation</strong> (art. 18) : demander la limitation du traitement</li>
      </ul>
      <p className="mt-2 text-sm">
        Pour exercer vos droits, contactez-nous à <a href="mailto:pipaselfie@gmail.com" className="text-primary hover:underline">pipaselfie@gmail.com</a> ou
        via le support intégré à l'application. Délai de réponse : 30 jours maximum.
      </p>
    </div>

    <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        8. Documents d'identité - Rétention limitée (72h)
      </h4>
      <p className="text-sm mb-3">
        Conformément au principe de minimisation des données du RGPD, nous appliquons une politique
        stricte de conservation des documents d'identité :
      </p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li>
          <strong>Délai maximum de 72 heures</strong> : Vos documents (selfie, pièce d'identité)
          sont conservés uniquement pendant le temps nécessaire à la vérification.
        </li>
        <li>
          <strong>Suppression automatique après validation</strong> : Dès que votre identité est
          approuvée ou refusée, vos documents sont immédiatement et définitivement supprimés.
        </li>
        <li>
          <strong>Suppression automatique après 72h</strong> : Si la vérification n'a pas été
          traitée dans les 72 heures, une tâche automatique supprime vos documents.
        </li>
        <li>
          <strong>Aucune conservation</strong> : Seul le statut de vérification (vérifié/non vérifié)
          est conservé. Vos documents d'identité ne sont jamais archivés.
        </li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">9. Transparence sur la modération</h4>
      <p className="mb-2">
        En cas d'infraction détectée ou de signalement, nous nous réservons le droit de :
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Consulter l'historique des conversations et médias échangés de l'utilisateur concerné</li>
        <li>Analyser le profil et les comportements de l'utilisateur via nos outils de modération</li>
        <li>Conserver les preuves nécessaires à l'enquête interne ou à une éventuelle procédure judiciaire</li>
      </ul>
      <p className="mt-2 text-sm">
        L'utilisateur en infraction est notifié par une mention « Infraction en cours » sur son compte.
        Ces données sont accessibles uniquement aux modérateurs et administrateurs autorisés.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">10. Réclamation</h4>
      <p>
        Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
        vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale
        de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>.
      </p>
    </div>

    {isAuthenticated && (
      <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Télécharger mes données
        </h4>
        <p className="text-sm mb-3">
          Conformément à l'article 20 du RGPD (droit à la portabilité), vous pouvez
          télécharger l'ensemble de vos données personnelles dans une archive ZIP contenant
          vos données structurées (JSON) et tous vos médias.
        </p>
        <Button
          onClick={onExportData}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          <Download className="w-4 h-4 mr-2" />
          Télécharger mes données
        </Button>
      </div>
    )}
  </LegalSection>
);

export default PrivacySection;
