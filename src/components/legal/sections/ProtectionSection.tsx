import { Users, Shield } from 'lucide-react';
import LegalSection from '../LegalSection';

const ProtectionSection = () => (
  <LegalSection id="protection" value="protection" title="Protection des utilisateurs" icon={Users}>
    <div>
      <h4 className="font-semibold text-foreground mb-2">Notre engagement</h4>
      <p>
        Gay Social s'engage à fournir un environnement sûr et respectueux pour
        tous ses membres. Nous mettons en œuvre des technologies et des processus
        de modération pour garantir votre sécurité.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Mesures de protection</h4>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Médias éphémères</strong> : Les photos/vidéos sensibles disparaissent définitivement après consultation par le destinataire. Aucune copie n'est conservée.</li>
        <li><strong>Chiffrement</strong> : Vos données sont chiffrées en transit (TLS/HTTPS) et au repos</li>
        <li><strong>Médias privés</strong> : Tous les fichiers sont stockés dans des espaces sécurisés, accessibles uniquement via des URLs temporaires signées</li>
        <li><strong>Modération 24/7</strong> : Équipe dédiée à la surveillance de la plateforme avec système de tâches automatisé</li>
      </ul>
    </div>

    <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-destructive" />
        Politique anti-capture d'écran
      </h4>
      <p className="text-sm mb-3">
        <strong className="text-foreground">Transparence :</strong> Aucune technologie ne permet
        d'empêcher physiquement une capture d'écran sur un appareil. Cependant, Gay Social a mis
        en place un <strong>système de détection et de sanctions automatiques</strong> pour dissuader
        et punir cette pratique.
      </p>
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-foreground">Comment ça fonctionne :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Notre système détecte les captures d'écran effectuées pendant la consultation de contenus privés et éphémères</li>
          <li>Chaque détection génère une <strong>notification automatique</strong> visible par les deux utilisateurs dans la conversation</li>
          <li>L'expéditeur du média est immédiatement informé que son contenu a été capturé</li>
          <li>Une tâche d'enquête est automatiquement créée pour nos modérateurs</li>
        </ul>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <p className="font-semibold text-foreground">Sanctions progressives :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>1ère infraction</strong> : Avertissement officiel</li>
          <li><strong>2ème infraction</strong> : Suspension automatique de 1 heure</li>
          <li><strong>3ème et 4ème infraction</strong> : Suspension automatique de 24 heures</li>
          <li><strong>5ème infraction et plus</strong> : Suspension automatique de 7 jours</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Les récidivistes peuvent faire l'objet d'un bannissement définitif après examen par l'équipe de modération.
        </p>
      </div>
      <div className="mt-3 text-sm">
        <p className="font-semibold text-foreground">Limites honnêtes :</p>
        <p className="mt-1">
          Nous ne prétendons pas bloquer 100% des captures. Un utilisateur déterminé peut toujours
          photographier son écran avec un autre appareil. Notre système vise à <strong>dissuader</strong>,
          <strong> détecter</strong> et <strong>sanctionner</strong> les contrevenants pour protéger au
          mieux la vie privée de nos membres.
        </p>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-foreground mb-2">Comment nous contacter</h4>
      <p>
        Pour toute question relative à vos données ou pour exercer vos droits RGPD,
        vous pouvez nous contacter via le support intégré à l'application ou par
        email à <a href="mailto:pipaselfie@gmail.com" className="text-primary hover:underline">pipaselfie@gmail.com</a>.
      </p>
    </div>
  </LegalSection>
);

export default ProtectionSection;
