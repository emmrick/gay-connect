import { FileText } from 'lucide-react';
import LegalSection from '../LegalSection';

const CGUSection = () => (
  <LegalSection id="cgu" value="cgu" title="Conditions Générales d'Utilisation (CGU)" icon={FileText}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Objet</h4>
      <p>
        Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation
        de la plateforme Gay Social, un service de mise en relation pour adultes majeurs
        de sexe masculin.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Conditions d'accès</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Être âgé d'au moins 18 ans</li>
        <li>Être de sexe masculin</li>
        <li>Fournir une pièce d'identité valide pour vérification</li>
        <li>Accepter les présentes CGU et la politique de confidentialité</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Vérification d'identité</h4>
      <p>
        Chaque utilisateur doit soumettre une pièce d'identité valide lors de son inscription.
        Cette vérification permet de confirmer l'âge et l'identité de l'utilisateur.
        <strong className="text-foreground"> Toutes les données d'identification sont définitivement
        supprimées après validation du compte.</strong>
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Responsabilités de l'utilisateur</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Respecter les autres membres et leur dignité</li>
        <li>Ne pas partager de contenus illégaux</li>
        <li>Ne pas usurper l'identité d'autrui</li>
        <li>Signaler tout comportement suspect ou abusif</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Sanctions</h4>
      <p>
        Tout manquement aux présentes CGU peut entraîner la suspension temporaire ou
        définitive du compte, sans préavis ni remboursement.
      </p>
    </div>
  </LegalSection>
);

export default CGUSection;
