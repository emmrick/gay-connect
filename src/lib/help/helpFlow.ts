/**
 * Arborescence statique du chatbot d'aide.
 * 10 rubriques principales, ~50 sous-rubriques, réponses rédigées et validées.
 * Aucun coût IA — 100 % flow décisionnel.
 */
import type { HelpNode } from './helpFlow.types';

export const HELP_ROOT_ID = 'root';

/** Réponse standardisée de bas de message pour inviter à continuer */
const BACK = "\n\n💡 Choisis une autre option ci-dessous, ou tape **« Menu »** pour revenir au début.";

export const HELP_FLOW: HelpNode = {
  id: HELP_ROOT_ID,
  label: 'Menu principal',
  children: [
    // ─────────────────────────────  1. PROFIL  ─────────────────────────────
    {
      id: 'profile',
      label: 'Mon profil',
      emoji: '👤',
      children: [
        {
          id: 'profile-edit',
          label: 'Modifier mes informations',
          emoji: '✏️',
          answer:
            "Pour modifier ton **pseudo**, ta **bio**, ton **âge** ou tes préférences :\n\n1. Va dans l'onglet **Profil**\n2. Touche le bouton **Modifier**\n3. Mets à jour les champs souhaités\n4. Valide avec **Enregistrer**\n\nCertaines informations (âge, pseudo) ne peuvent être modifiées qu'**une fois tous les 30 jours**.\n\n[LINK:/profile]",
        },
        {
          id: 'profile-photo',
          label: 'Ajouter / changer ma photo',
          emoji: '📸',
          answer:
            "**Au moins une photo de profil est obligatoire** pour accéder à l'application.\n\n1. Ouvre ton **Profil**\n2. Touche ta photo actuelle (ou l'icône appareil photo)\n3. Choisis une photo dans ta galerie ou prends-en une nouvelle\n4. Recadre puis valide\n\n⚠️ Les photos doivent respecter nos **règles de conduite** (pas de mineur, pas de contenu volé).\n\n[LINK:/profile]",
        },
        {
          id: 'profile-verify',
          label: "Vérification d'identité (badge bleu)",
          emoji: '✅',
          answer:
            "La **vérification d'identité** te donne un **badge bleu** et améliore ta visibilité.\n\nÉtapes :\n1. Va dans **Paramètres → Vérification d'identité**\n2. Prends une photo recto et verso de ta pièce d'identité\n3. Prends un selfie en tenant ta pièce\n4. Soumets la demande\n\nUn modérateur traite ta demande sous **24 à 48 h**. Tes documents sont **supprimés automatiquement** après validation.\n\n[LINK:/profile/verify-identity]",
        },
        {
          id: 'profile-visibility',
          label: 'Visibilité de mon profil',
          emoji: '👁️',
          answer:
            "Ton profil est visible uniquement par les **membres vérifiés** ayant au moins une photo. Tu peux :\n\n• Activer le **mode invisible** (Paramètres → Confidentialité)\n• Bloquer certains profils (depuis leur fiche)\n• Restreindre les messages selon une **tranche d'âge**\n\n[LINK:/parametres]",
        },
        {
          id: 'profile-age-filter',
          label: "Filtre d'âge des contacts",
          emoji: '🎯',
          answer:
            "Tu peux limiter les personnes pouvant t'envoyer un message :\n\n1. **Paramètres → Contacts**\n2. Active **Filtrer par âge**\n3. Définis ton intervalle (ex : 25-45 ans)\n\nLes membres en dehors de cet intervalle ne pourront plus t'écrire (sauf si tu les ajoutes manuellement aux exceptions).\n\n[LINK:/parametres]",
        },
      ],
    },

    // ─────────────────────────────  2. CRÉDITS  ─────────────────────────────
    {
      id: 'credits',
      label: 'Crédits & paiements',
      emoji: '💎',
      children: [
        {
          id: 'credits-earn',
          label: 'Gagner des crédits gratuits',
          emoji: '🎁',
          answer:
            "Tu peux gagner des crédits **sans dépenser un centime** :\n\n• **Connexion quotidienne** : +1 crédit/jour\n• **Parrainage** : +30 crédits par filleul inscrit\n• **Compléter ton profil** : +5 crédits\n• **Codes promo** (flyers, événements)\n• **Cadeaux d'anniversaire** entre membres\n\n[LINK:/credits]",
        },
        {
          id: 'credits-buy',
          label: 'Acheter des crédits',
          emoji: '💳',
          answer:
            "Pour acheter des crédits via **PayPal** :\n\n1. Va sur la page **Crédits**\n2. Choisis une offre (10, 50, 100, 500…)\n3. Clique sur **Acheter** puis paie via PayPal\n4. Les crédits sont ajoutés **immédiatement**\n\n💡 Pendant les **promotions**, tu obtiens jusqu'à **+100 %** de crédits offerts.\n\n[LINK:/credits]",
        },
        {
          id: 'credits-history',
          label: 'Solde et historique',
          emoji: '📊',
          answer:
            "Ton solde s'affiche en haut de la page **Crédits**. Pour consulter l'historique complet :\n\n1. Page **Crédits**\n2. Onglet **Historique**\n3. Filtre par type (achat, dépense, bonus, cadeau…)\n\nChaque transaction est horodatée et détaillée.\n\n[LINK:/credits]",
        },
        {
          id: 'credits-promo',
          label: 'Codes promo & flyers',
          emoji: '🎟️',
          answer:
            "Pour utiliser un **code promo** (flyer, événement, parrainage) :\n\n1. Va sur **Crédits → Code promo**\n2. Saisis le code reçu\n3. Valide\n\nLes crédits offerts s'ajoutent immédiatement à ton solde. Un même code ne peut être utilisé qu'**une seule fois par compte**.\n\n[LINK:/credits]",
        },
        {
          id: 'credits-costs',
          label: 'Coût des fonctionnalités',
          emoji: '💰',
          answer:
            "Voici les coûts indicatifs (variables selon les promotions) :\n\n• **Boost de profil** : 10 crédits / 24 h\n• **Selfie éphémère** : 1 crédit\n• **Cadeau de crédits** : 1 à 5 crédits offerts\n• **Création d'album privé** : gratuit\n• **Demande d'accès album privé** : 2 crédits\n• **Message enregistré** : 0,5 à 2 crédits\n\nLes coûts exacts s'affichent **avant chaque action**.",
        },
        {
          id: 'credits-payment-issue',
          label: 'Problème de paiement',
          emoji: '⚠️',
          answer:
            "Si ton paiement PayPal a été débité mais les crédits ne sont pas arrivés :\n\n1. Vérifie ton **historique** (Crédits → Historique)\n2. Attends **5 minutes** (parfois un délai)\n3. Si toujours rien, **contacte un agent** avec :\n   • La date du paiement\n   • L'ID de transaction PayPal\n   • Le montant\n\nLe remboursement ou le crédit manuel est généralement effectué sous 24 h.",
        },
      ],
    },

    // ─────────────────────────────  3. MESSAGERIE  ─────────────────────────────
    {
      id: 'messaging',
      label: 'Messagerie',
      emoji: '💬',
      children: [
        {
          id: 'messaging-send',
          label: 'Envoyer un message privé',
          emoji: '📨',
          answer:
            "Pour envoyer un message privé :\n\n1. Ouvre le **profil** d'un membre\n2. Touche **Envoyer un message**\n3. Rédige et envoie\n\nTu peux aussi accéder à toutes tes conversations depuis l'onglet **Messages** en bas de l'écran.\n\n[LINK:/messages]",
        },
        {
          id: 'messaging-filter',
          label: 'Filtres de contact',
          emoji: '🛡️',
          answer:
            "Pour limiter qui peut te contacter :\n\n• **Filtre d'âge** : Paramètres → Contacts\n• **Blocage** : depuis le profil → menu ⋮ → Bloquer\n• **Mode invisible** : Paramètres → Confidentialité\n\nUne personne bloquée ne peut plus voir ton profil ni t'écrire.\n\n[LINK:/parametres]",
        },
        {
          id: 'messaging-gift',
          label: 'Envoyer un cadeau de crédits',
          emoji: '🎁',
          answer:
            "Tu peux **offrir 1 à 5 crédits** à un autre membre directement dans la conversation :\n\n1. Ouvre la conversation\n2. Touche le **+** à gauche du champ de saisie\n3. Choisis **Cadeau**\n4. Sélectionne le montant et confirme\n\nLes crédits sont déduits de ton solde et ajoutés en **bonus** au destinataire.",
        },
        {
          id: 'messaging-snap',
          label: 'Selfies éphémères',
          emoji: '⚡',
          answer:
            "Les **selfies éphémères** disparaissent après visionnage :\n\n1. Dans la conversation, touche **+ → Selfie**\n2. **Appui court** = photo, **appui long** = vidéo (60 s max)\n3. Envoie\n\nLe destinataire ne peut le voir qu'**une seule fois**. Les captures d'écran sont **détectées et sanctionnées**.",
        },
        {
          id: 'messaging-reactions',
          label: 'Réactions et messages épinglés',
          emoji: '📌',
          answer:
            "**Réagir** : appui long sur un message → choisis un emoji.\n\n**Épingler** : appui long → **Épingler**. Les messages épinglés s'affichent en haut de la conversation.\n\n**Rechercher** : touche la **loupe** dans l'en-tête de la conversation.",
        },
        {
          id: 'messaging-autodelete',
          label: 'Suppression auto',
          emoji: '🗑️',
          answer:
            "Tu peux configurer la **suppression automatique** des messages d'une conversation :\n\n1. Ouvre la conversation\n2. Menu ⋮ → **Suppression auto**\n3. Choisis le délai (24 h, 7 jours, 30 jours, jamais)\n\nLes messages plus anciens sont masqués automatiquement de **ton côté uniquement**.",
        },
      ],
    },

    // ─────────────────────────────  4. ALBUMS  ─────────────────────────────
    {
      id: 'albums',
      label: 'Albums & médias',
      emoji: '📁',
      children: [
        {
          id: 'albums-create',
          label: 'Créer un album',
          emoji: '➕',
          answer:
            "Pour créer un album :\n\n1. **Profil → Albums**\n2. Touche **+ Nouvel album**\n3. Donne-lui un nom et choisis **Public** ou **Privé**\n4. Ajoute des photos/vidéos\n\nTu peux créer **autant d'albums que tu veux**, gratuitement.\n\n[LINK:/profile]",
        },
        {
          id: 'albums-public-private',
          label: 'Public vs Privé',
          emoji: '🔐',
          answer:
            "**Album public** : visible par tous les membres sur ton profil.\n\n**Album privé** : aperçu **flouté**, accessible uniquement aux personnes à qui tu as donné l'accès. Idéal pour le contenu sensible.\n\nTu peux changer la visibilité d'un album à tout moment depuis ses paramètres.",
        },
        {
          id: 'albums-share',
          label: 'Partager un album',
          emoji: '📤',
          answer:
            "Pour partager un album dans une conversation :\n\n1. Ouvre la conversation\n2. Touche **+ → Album**\n3. Sélectionne l'album\n4. Définis la durée d'accès (1 h, 24 h, 7 jours, illimité)\n\nTu peux **arrêter le partage à tout moment** en cliquant sur **Arrêter le partage** dans la conversation.",
        },
        {
          id: 'albums-request',
          label: "Demander l'accès à un album privé",
          emoji: '🔓',
          answer:
            "Si un membre a un album privé, tu peux **demander l'accès** :\n\n1. Va sur son profil → onglet **Albums**\n2. Touche l'album privé\n3. Confirme la demande (**2 crédits**)\n\nLe propriétaire reçoit ta demande dans la conversation et peut **accepter ou refuser**. Si refusée, les crédits te sont remboursés.",
        },
        {
          id: 'albums-watermark',
          label: 'Filigrane et protection',
          emoji: '💧',
          answer:
            "Toutes les photos affichent un **filigrane « Gay Social »** pour décourager le vol.\n\n• Les **captures d'écran** sont détectées et sanctionnées\n• Les médias sont stockés dans des **buckets privés sécurisés**\n• Les selfies éphémères sont supprimés après visionnage\n\nMalgré ces protections, **réfléchis bien avant de partager du contenu sensible**.",
        },
      ],
    },

    // ─────────────────────────────  5. DÉCOUVERTE  ─────────────────────────────
    {
      id: 'discover',
      label: 'Découverte (Swipe & Proximité)',
      emoji: '🔥',
      children: [
        {
          id: 'discover-swipe',
          label: 'Comment fonctionne le Swipe',
          emoji: '💘',
          answer:
            "Le **Swipe** te présente des profils un par un :\n\n• **Glisse à droite** ❤️ pour liker\n• **Glisse à gauche** ❌ pour passer\n• Touche le profil pour voir les détails\n\nSi deux personnes se likent mutuellement, c'est un **match** ! Tu peux ensuite démarrer une conversation.\n\n[LINK:/swipe]",
        },
        {
          id: 'discover-proximity',
          label: 'Onglet Proximité',
          emoji: '📍',
          answer:
            "L'onglet **Proximité** affiche les membres autour de toi :\n\n• **Géolocalisation requise** (autorise-la dans ton navigateur)\n• Choisis ton rayon (1 km à 200 km)\n• Badge **« Très proche »** si < 100 m\n\nSi tu refuses la géolocalisation, l'onglet est désactivé.\n\n[LINK:/home]",
        },
        {
          id: 'discover-boost',
          label: 'Boost de profil',
          emoji: '🚀',
          answer:
            "Le **Boost** met ton profil en avant pendant **24 h** sur la page Swipe :\n\n• **Coût** : 10 crédits\n• Tu apparais en priorité dans la pile des autres membres\n• Idéal pour augmenter tes matchs\n\nActive-le depuis ton profil → **Boost mon profil**.",
        },
        {
          id: 'discover-visits',
          label: 'Visites de profil',
          emoji: '👀',
          answer:
            "Chaque visite de ton profil est enregistrée. Pour voir qui a consulté ton profil :\n\n1. Va dans l'onglet **Accueil → Visites**\n2. Liste des derniers visiteurs avec date et heure\n\nTu peux désactiver l'enregistrement de tes propres visites depuis **Paramètres → Confidentialité**.",
        },
        {
          id: 'discover-favorites',
          label: 'Favoris',
          emoji: '⭐',
          answer:
            "Pour ajouter un membre aux **favoris** :\n\n1. Ouvre son profil\n2. Touche l'icône **étoile** ⭐\n\nTes favoris sont accessibles depuis l'onglet **Accueil → Favoris**. La personne n'est pas notifiée.",
        },
      ],
    },

    // ─────────────────────────────  6. GROUPES  ─────────────────────────────
    {
      id: 'groups',
      label: 'Groupes & régions',
      emoji: '👥',
      children: [
        {
          id: 'groups-join',
          label: 'Rejoindre un groupe régional',
          emoji: '🗺️',
          answer:
            "**101 groupes régionaux** (un par département) sont disponibles :\n\n1. Va dans **Messages → Groupes**\n2. Touche **Rejoindre un groupe**\n3. Choisis ta région\n\nLe **premier groupe est gratuit**. Les groupes supplémentaires coûtent quelques crédits.\n\n[LINK:/messages]",
        },
        {
          id: 'groups-create',
          label: 'Créer un groupe personnalisé',
          emoji: '✨',
          answer:
            "Pour créer ton propre groupe (thématique, événement…) :\n\n1. **Messages → Groupes → +**\n2. Donne-lui un nom, une description, une photo\n3. Invite des membres\n\nLes groupes personnalisés sont **modérables** : tu peux retirer des membres et nommer des co-modérateurs.",
        },
        {
          id: 'groups-moderate',
          label: 'Modérer un groupe',
          emoji: '🛡️',
          answer:
            "En tant que **créateur ou modérateur** d'un groupe :\n\n• Supprimer un message : appui long → **Supprimer**\n• Retirer un membre : liste membres → menu ⋮\n• Modifier nom/photo : Paramètres du groupe\n• Verrouiller un sondage\n\nLes membres peuvent te signaler aux administrateurs en cas d'abus.",
        },
        {
          id: 'groups-polls',
          label: 'Sondages et événements',
          emoji: '📊',
          answer:
            "Dans un groupe, tu peux créer :\n\n• **Sondages** : touche **+ → Sondage**, ajoute des options. Choix unique ou multiple.\n• **Événements** : touche **+ → Événement**, indique date, lieu, description. Les membres peuvent répondre **Présent / Peut-être / Absent**.\n\nLes résultats sont visibles en temps réel.",
        },
        {
          id: 'groups-mute',
          label: 'Couper les notifications',
          emoji: '🔕',
          answer:
            "Pour ne plus recevoir de notifications d'un groupe :\n\n1. Ouvre le groupe\n2. Menu ⋮ → **Couper les notifications**\n\nTu restes membre du groupe et tu peux toujours le consulter, mais tu n'es plus notifié des nouveaux messages.",
        },
      ],
    },

    // ─────────────────────────────  7. SÉCURITÉ  ─────────────────────────────
    {
      id: 'security',
      label: 'Sécurité & confidentialité',
      emoji: '🔒',
      children: [
        {
          id: 'security-block',
          label: 'Bloquer un membre',
          emoji: '🚫',
          answer:
            "Pour bloquer un membre :\n\n1. Va sur son profil\n2. Menu ⋮ → **Bloquer**\n3. Confirme\n\nUne fois bloqué :\n• Il ne peut plus voir ton profil\n• Vos conversations sont masquées\n• Il ne peut plus t'écrire\n\nTu peux **débloquer** depuis **Paramètres → Membres bloqués**.",
        },
        {
          id: 'security-report',
          label: 'Signaler un membre',
          emoji: '🚨',
          answer:
            "Pour signaler un comportement inapproprié :\n\n1. Va sur le profil concerné\n2. Menu ⋮ → **Signaler**\n3. Choisis le motif (harcèlement, faux profil, contenu illégal…)\n4. Détaille si besoin\n\nL'équipe de **modération** examine chaque signalement. Les abus sont sanctionnés (avertissement, suspension, bannissement).",
        },
        {
          id: 'security-screenshot',
          label: 'Captures d\'écran',
          emoji: '📷',
          answer:
            "Les **captures d'écran** dans les conversations privées et sur les selfies éphémères sont **détectées automatiquement**.\n\n**Sanctions progressives** :\n• 1ʳᵉ capture : avertissement\n• 2ᵉ capture : suspension 24 h\n• 3ᵉ capture : suspension 7 jours\n• Récidive : bannissement définitif\n\nLes captures sur du contenu privé d'autrui sont une atteinte au respect.",
        },
        {
          id: 'security-pin',
          label: 'Verrouillage PIN / biométrie',
          emoji: '🔐',
          answer:
            "Active un **code PIN à 6 chiffres** ou la **biométrie** (empreinte/visage) pour protéger l'accès à l'application :\n\n1. **Paramètres → Sécurité**\n2. Active **Verrouillage de l'app**\n3. Définis ton PIN\n\nLe verrouillage s'active à chaque ouverture de l'application.",
        },
        {
          id: 'security-cookies',
          label: 'Cookies et données',
          emoji: '🍪',
          answer:
            "Tu peux gérer ton consentement aux **cookies** à tout moment :\n\n1. **Paramètres → Confidentialité → Cookies**\n2. Active/désactive : essentiels, statistiques, publicité\n\nConsulte aussi notre **politique de confidentialité** et nos **règles de conduite**.\n\n[LINK:/regles]",
        },
        {
          id: 'security-words',
          label: 'Mots interdits',
          emoji: '🛑',
          answer:
            "Le système détecte automatiquement les **mots interdits** dans les messages (insultes, contenu illégal, contournements) selon les **règles de conduite**.\n\nLes messages bloqués ne sont pas envoyés et tu reçois un avertissement. Les abus répétés peuvent entraîner une suspension.\n\n[LINK:/regles]",
        },
      ],
    },

    // ─────────────────────────────  8. COUPLE  ─────────────────────────────
    {
      id: 'couple',
      label: 'Compte couple',
      emoji: '💑',
      children: [
        {
          id: 'couple-create',
          label: 'Créer un compte couple',
          emoji: '➕',
          answer:
            "Le **compte couple** permet à deux utilisateurs de partager un même login tout en gardant leur identité :\n\n1. **Paramètres → Compte couple**\n2. Touche **Créer un compte couple**\n3. Tu reçois un **code d'invitation**\n\nTon partenaire l'utilisera pour rejoindre le compte.",
        },
        {
          id: 'couple-invite',
          label: 'Inviter mon partenaire',
          emoji: '💌',
          answer:
            "Une fois ton compte couple créé :\n\n1. Partage le **code d'invitation** à ton partenaire\n2. Il se connecte → **Paramètres → Rejoindre un compte couple**\n3. Il saisit le code\n\nLe lien est validé et vous êtes désormais connectés.",
        },
        {
          id: 'couple-share',
          label: 'Partager les conversations',
          emoji: '👥',
          answer:
            "Tu peux choisir si **les conversations sont partagées** entre les deux partenaires :\n\n1. **Paramètres → Compte couple**\n2. Active/désactive **Partager les conversations**\n\nSi activé, vous voyez tous les deux les mêmes messages reçus et envoyés.",
        },
        {
          id: 'couple-leave',
          label: 'Quitter le compte couple',
          emoji: '🚪',
          answer:
            "Pour dissoudre un compte couple :\n\n1. **Paramètres → Compte couple**\n2. Touche **Quitter le compte couple**\n3. Confirme\n\nLes deux comptes redeviennent indépendants. L'historique partagé est conservé du côté du créateur.",
        },
      ],
    },

    // ─────────────────────────────  9. MON COMPTE  ─────────────────────────────
    {
      id: 'account',
      label: 'Mon compte',
      emoji: '⚙️',
      children: [
        {
          id: 'account-password',
          label: 'Changer mon mot de passe',
          emoji: '🔑',
          answer:
            "Pour changer ton mot de passe :\n\n1. **Paramètres → Sécurité → Mot de passe**\n2. Saisis ton mot de passe actuel\n3. Saisis le nouveau (min. 8 caractères)\n4. Confirme\n\nSi tu l'as oublié, utilise **« Mot de passe oublié »** sur la page de connexion.",
        },
        {
          id: 'account-email',
          label: 'Changer mon email',
          emoji: '📧',
          answer:
            "Pour changer ton adresse email :\n\n1. **Paramètres → Compte → Email**\n2. Saisis la nouvelle adresse\n3. Confirme via le **lien envoyé** sur la nouvelle adresse\n\nL'ancienne adresse reste valide tant que tu n'as pas confirmé la nouvelle.",
        },
        {
          id: 'account-suspend',
          label: 'Suspendre mon compte',
          emoji: '⏸️',
          answer:
            "Tu peux **suspendre temporairement** ton compte (pause) :\n\n1. **Paramètres → Compte → Suspendre**\n2. Confirme\n\nTon profil n'est plus visible et tu ne reçois plus de messages. Tu peux **réactiver** ton compte à tout moment en te reconnectant.",
        },
        {
          id: 'account-delete',
          label: 'Supprimer mon compte',
          emoji: '🗑️',
          answer:
            "Pour **supprimer définitivement** ton compte :\n\n1. **Paramètres → Compte → Supprimer mon compte**\n2. Confirme avec ton mot de passe\n\n⚠️ Un délai de **30 jours** s'applique avant suppression définitive (tu peux annuler en te reconnectant). Après 30 jours, **toutes tes données sont effacées** et **irrécupérables**.",
        },
        {
          id: 'account-export',
          label: 'Exporter mes données (RGPD)',
          emoji: '📦',
          answer:
            "Tu peux télécharger **toutes tes données personnelles** dans une archive ZIP :\n\n1. **Paramètres → Compte → Exporter mes données**\n2. Touche **Demander l'export**\n3. Tu reçois un email avec un **lien de téléchargement** sous 24 h\n\nL'archive contient ton profil, tes messages, tes albums, tes transactions, etc.",
        },
      ],
    },

    // ─────────────────────────────  10. AUTRES  ─────────────────────────────
    {
      id: 'other',
      label: 'Autres',
      emoji: '📢',
      children: [
        {
          id: 'other-moderator',
          label: 'Devenir modérateur',
          emoji: '🛡️',
          answer:
            "Les **modérateurs** sont rémunérés par mission (vérifications d'identité, support chat, modération de contenu).\n\nLes recrutements sont **ponctuels** et annoncés via le **Canal Informations**. Si tu es intéressé, contacte un agent en précisant ta motivation.",
        },
        {
          id: 'other-ads',
          label: 'Acheter un espace publicitaire',
          emoji: '📣',
          answer:
            "Tu peux promouvoir un commerce, un événement ou un service via notre **portail annonceur** :\n\n• **Multi-formats** (bannières, cartes, vignettes)\n• **Ciblage géographique** (codes postaux)\n• Tarif au **clic** ou à l'**impression**\n\nContacte un agent pour obtenir l'accès au portail annonceur.",
        },
        {
          id: 'other-referral',
          label: 'Système de parrainage',
          emoji: '🤝',
          answer:
            "**Parraine tes amis** et gagne des crédits :\n\n1. **Paramètres → Parrainage**\n2. Récupère ton **lien unique**\n3. Partage-le\n\nQuand un ami s'inscrit via ton lien :\n• **Toi** : +30 crédits\n• **Lui** : +30 crédits\n\nAucune limite au nombre de filleuls.",
        },
        {
          id: 'other-pwa',
          label: 'Application mobile (PWA)',
          emoji: '📱',
          answer:
            "Gay Social est une **PWA** : tu peux l'installer comme une vraie application :\n\n**iPhone (Safari)** : Partager → Ajouter à l'écran d'accueil\n**Android (Chrome)** : Menu ⋮ → Installer l'application\n\nUne fois installée, elle s'ouvre en plein écran, fonctionne en arrière-plan et reçoit les notifications push.",
        },
        {
          id: 'other-support',
          label: 'Contacter le support',
          emoji: '💬',
          answer:
            "Tu n'as pas trouvé de réponse à ta question ?\n\nClique sur **« 👤 Parler à un agent »** en bas de l'écran. Un conseiller te répondra dès qu'il est disponible (généralement sous quelques minutes).\n\nN'oublie pas de bien décrire ton problème pour un traitement plus rapide.",
        },
      ],
    },
  ],
};

/** Recherche un node par ID dans tout l'arbre */
export function findNodeById(id: string, root: HelpNode = HELP_FLOW): HelpNode | null {
  if (root.id === id) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeById(id, child);
    if (found) return found;
  }
  return null;
}

/** Renvoie le chemin (breadcrumb) jusqu'au node ciblé */
export function findPathToNode(id: string, root: HelpNode = HELP_FLOW): HelpNode[] {
  if (root.id === id) return [root];
  if (!root.children) return [];
  for (const child of root.children) {
    const path = findPathToNode(id, child);
    if (path.length > 0) return [root, ...path];
  }
  return [];
}
