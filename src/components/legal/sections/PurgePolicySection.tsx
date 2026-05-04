import { Trash2 } from 'lucide-react';
import LegalSection from '../LegalSection';

const PurgePolicySection = () => (
  <LegalSection
    id="purge-policy"
    value="purge-policy"
    title="Suppression des comptes non vérifiés (30 jours)"
    icon={Trash2}
    iconBgClassName="bg-destructive/20"
    iconClassName="text-destructive"
  >
    <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
      <p className="font-semibold text-destructive">
        ⚠️ Tout compte non vérifié dans un délai de 30 jours après l'inscription sera
        définitivement supprimé, ainsi que l'intégralité des données associées.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Principe</h4>
      <p>
        La vérification d'identité est obligatoire pour utiliser GaySocial. Afin de garantir
        la sécurité de notre communauté et le respect de la législation sur les contenus adultes,
        tout utilisateur dispose d'un délai de <strong className="text-foreground">30 jours calendaires</strong> à
        compter de son inscription pour compléter sa vérification d'identité.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Notifications de rappel</h4>
      <p>Avant la suppression, l'utilisateur reçoit des notifications de rappel :</p>
      <ul className="list-disc pl-5 space-y-2 mt-2">
        <li><strong>J-7</strong> : Première notification de rappel indiquant qu'il reste 7 jours avant la suppression du compte.</li>
        <li><strong>J-3</strong> : Notification d'avertissement urgente avec 3 jours restants.</li>
        <li><strong>J-1</strong> : Dernière notification critique indiquant la suppression imminente dans les 24 heures.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Données supprimées</h4>
      <p>
        En cas de non-vérification dans le délai imparti, les éléments suivants sont
        <strong className="text-destructive"> définitivement et irréversiblement supprimés</strong> de
        tous nos serveurs :
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>Profil utilisateur et toutes les informations personnelles</li>
        <li>Photos de profil et albums photos</li>
        <li>Messages privés et messages de groupe</li>
        <li>Médias éphémères et fichiers partagés</li>
        <li>Historique de crédits et transactions</li>
        <li>Favoris, réactions et préférences</li>
        <li>Compte d'authentification</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Caractère irréversible</h4>
      <p>
        La suppression est <strong className="text-foreground">totale et définitive</strong>.
        Aucune récupération de données ne sera possible après l'exécution de la purge.
        L'utilisateur devra créer un nouveau compte et recommencer le processus d'inscription
        et de vérification.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Exceptions</h4>
      <p>
        Les comptes dont la vérification est <strong className="text-foreground">en cours de traitement</strong> (soumise
        et en attente de validation par notre équipe) ne sont pas concernés par cette politique
        de suppression automatique tant que le dossier est à l'étude.
      </p>
    </div>
  </LegalSection>
);

export default PurgePolicySection;
