import { Scale } from 'lucide-react';
import LegalSection from '../LegalSection';

const MentionsLegalesSection = () => (
  <LegalSection
    id="mentions-legales"
    value="mentions-legales"
    title="Mentions légales - Éditeur & Développeur"
    icon={Scale}
  >
    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Éditeur et développeur du site</h4>
      <ul className="space-y-2">
        <li><strong>Nom :</strong> BAYART Emmrick</li>
        <li><strong>Statut :</strong> Auto-entrepreneur</li>
        <li><strong>Adresse de domiciliation :</strong> 61 Rue de Lion, 75012 Paris, France</li>
        <li><strong>SIRET :</strong> 977 861 665 00015</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Directeur de la publication</h4>
      <p>BAYART Emmrick</p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Contact</h4>
      <p>Pour toute question relative au site, vous pouvez nous contacter :</p>
      <ul className="space-y-2 mt-2">
        <li><strong>Email :</strong> <a href="mailto:pipaselfie@gmail.com" className="text-primary hover:underline">pipaselfie@gmail.com</a></li>
        <li>Ou via la messagerie intégrée à l'application.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Hébergement</h4>
      <p>
        Le site est hébergé par Lovable Cloud. Les données sont stockées sur des
        serveurs sécurisés conformément aux normes en vigueur.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Propriété intellectuelle</h4>
      <p>
        L'ensemble du contenu du site Gay Social (textes, images, logos, code source)
        est la propriété exclusive de BAYART Emmrick. Toute reproduction, même partielle,
        est interdite sans autorisation préalable.
      </p>
    </div>
  </LegalSection>
);

export default MentionsLegalesSection;
