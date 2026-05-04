import { FileText } from 'lucide-react';
import LegalSection from '../LegalSection';

const CookiesSection = () => (
  <LegalSection id="cookies" value="cookies" title="Politique de cookies" icon={FileText}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">1. Qu'est-ce qu'un cookie ?</h4>
      <p>
        Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette)
        lors de votre visite sur un site web. Il permet au site de mémoriser certaines informations
        pour faciliter votre navigation.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">2. Cookies utilisés par Gay Social</h4>
      <p className="mb-3">
        Gay Social utilise <strong className="text-foreground">uniquement des cookies techniques
        et fonctionnels</strong>. Nous n'utilisons <strong className="text-foreground">aucun cookie publicitaire,
        aucun traceur tiers, ni aucun outil de profilage marketing</strong>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-semibold text-foreground">Cookie / Stockage</th>
              <th className="text-left py-2 pr-4 font-semibold text-foreground">Finalité</th>
              <th className="text-left py-2 font-semibold text-foreground">Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
              <td className="py-2 pr-4">Session d'authentification</td>
              <td className="py-2">Session / 7 jours</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">gc_cookie_consent</td>
              <td className="py-2 pr-4">Mémorisation du choix cookies</td>
              <td className="py-2">1 an</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">gc_age_confirmed</td>
              <td className="py-2 pr-4">Confirmation de majorité</td>
              <td className="py-2">Session</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">theme</td>
              <td className="py-2 pr-4">Préférence thème clair/sombre</td>
              <td className="py-2">Persistant</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">localStorage divers</td>
              <td className="py-2 pr-4">Préférences de navigation, PWA, onboarding</td>
              <td className="py-2">Persistant</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">3. Catégories de cookies</h4>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Cookies essentiels</strong> (obligatoires) : nécessaires au fonctionnement du site
          (authentification, sécurité, session). Ne peuvent pas être désactivés.
        </li>
        <li>
          <strong>Cookies de préférences</strong> (optionnels) : mémorisent vos choix de personnalisation
          (thème, langue, dernière page visitée).
        </li>
        <li>
          <strong>Cookies de statistiques anonymes</strong> (optionnels) : nous permettent d'améliorer
          le service en comptabilisant les visites de manière anonyme. Aucune donnée n'est transmise à des tiers.
        </li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">4. Cookies tiers</h4>
      <p>
        <strong className="text-foreground">Gay Social n'utilise aucun cookie tiers.</strong> Nous
        n'intégrons aucun outil de tracking externe (pas de Google Analytics, Facebook Pixel,
        ni aucun réseau publicitaire). Votre activité sur notre site n'est jamais partagée avec
        des annonceurs ou des réseaux sociaux.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">5. Gestion de vos préférences</h4>
      <p>
        Vous pouvez modifier vos préférences de cookies à tout moment en supprimant vos données
        de navigation dans les paramètres de votre navigateur ou en effaçant le stockage local du site.
      </p>
      <p className="mt-2 text-sm">
        <strong>Important :</strong> La désactivation des cookies essentiels empêchera le fonctionnement
        normal du site (connexion, navigation).
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">6. Base légale</h4>
      <p>
        Conformément à l'article 82 de la loi Informatique et Libertés et à la directive ePrivacy
        (2002/58/CE), les cookies strictement nécessaires sont exemptés de consentement.
        Pour les cookies non essentiels, votre consentement est recueilli via notre bandeau cookies
        lors de votre première visite.
      </p>
    </div>
  </LegalSection>
);

export default CookiesSection;
