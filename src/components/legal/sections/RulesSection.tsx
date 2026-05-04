import { Shield } from 'lucide-react';
import LegalSection from '../LegalSection';

const RulesSection = () => (
  <LegalSection id="rules" value="rules" title="Règlement du site" icon={Shield}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">Accès au site</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Réservé aux hommes de 18 ans et plus</strong></li>
        <li>Vérification d'identité obligatoire à l'inscription</li>
        <li>Un seul compte par personne</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Comportements interdits</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Harcèlement, insultes ou menaces</li>
        <li>Discrimination sous toute forme</li>
        <li>Spam ou publicité non sollicitée</li>
        <li>Partage de contenus illégaux</li>
        <li>Capture d'écran de contenus éphémères</li>
        <li>Usurpation d'identité ou faux profils</li>
      </ul>
    </div>

    <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
      <h4 className="font-semibold text-destructive mb-2">🛡️ Protection contre les personnes mal intentionnées</h4>
      <p className="mb-3">Gay Social met en place des mesures strictes pour protéger ses membres :</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Détection des profils suspects</strong> : Les comptes créés uniquement pour cibler des membres plus âgés ou vulnérables sont identifiés et supprimés.</li>
        <li><strong>Signalement facilité</strong> : Tout comportement suspect peut être signalé en quelques clics.</li>
        <li><strong>Modération active</strong> : Notre équipe surveille la plateforme 24/7 pour détecter les arnaques et comportements malveillants.</li>
        <li><strong>Vérification d'identité</strong> : Limite les faux profils et les personnes mal intentionnées.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Signaux d'alerte</h4>
      <p className="mb-2">Méfiez-vous des utilisateurs qui :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Demandent de l'argent ou des cadeaux</li>
        <li>Refusent de se montrer en vidéo</li>
        <li>Proposent de quitter rapidement la plateforme</li>
        <li>Racontent des histoires dramatiques pour obtenir de l'aide financière</li>
        <li>Semblent trop insistants ou pressés</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Sanctions</h4>
      <p>Les infractions au règlement entraînent :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Avertissement</strong> pour les infractions mineures</li>
        <li><strong>Suspension temporaire</strong> (24h à 30 jours) selon la gravité</li>
        <li><strong>Bannissement définitif</strong> pour les infractions graves</li>
        <li><strong>Signalement aux autorités</strong> si nécessaire</li>
      </ul>
    </div>
  </LegalSection>
);

export default RulesSection;
