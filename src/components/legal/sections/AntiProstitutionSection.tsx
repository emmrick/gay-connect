import { Ban } from 'lucide-react';
import LegalSection from '../LegalSection';

const AntiProstitutionSection = () => (
  <LegalSection
    id="anti-prostitution"
    value="anti-prostitution"
    title="Clause anti-prostitution"
    icon={Ban}
    iconBgClassName="bg-destructive/20"
    iconClassName="text-destructive"
  >
    <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
      <p className="font-semibold text-destructive">
        ⚠️ Toute transaction financière entre utilisateurs en échange d'un acte sexuel
        est strictement interdite.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Interdictions formelles</h4>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Paiement pour une rencontre garantie</strong> : Il est interdit de proposer ou demander de l'argent en échange d'une rencontre.</li>
        <li><strong>Paiement pour un rapport sexuel</strong> : Toute forme de prostitution ou d'escorting est prohibée.</li>
        <li><strong>Transactions entre membres pour du sexe</strong> : Aucun échange d'argent, de cadeaux ou de services contre des faveurs sexuelles n'est toléré.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Sanctions</h4>
      <p>
        Tout utilisateur ne respectant pas ces règles sera <strong>immédiatement et
        définitivement banni</strong> de la plateforme. Les autorités compétentes
        pourront être alertées si nécessaire.
      </p>
    </div>
  </LegalSection>
);

export default AntiProstitutionSection;
