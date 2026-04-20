/**
 * Arborescence statique du chatbot d'aide.
 * 10 rubriques principales, ~50 sous-rubriques, réponses rédigées et validées.
 * Aucun coût IA — 100 % flow décisionnel.
 *
 * 💡 Les réponses sont volontairement détaillées (étapes, astuces, FAQ croisées
 * via `related`) pour limiter les escalades vers un agent humain.
 */
import type { HelpNode } from './helpFlow.types';

export const HELP_ROOT_ID = 'root';

/** ID spécial : intercepté dans Help.tsx pour relancer le tour d'onboarding plein écran. */
export const HELP_OPEN_TOUR_ID = '__open_onboarding_tour';

export const HELP_FLOW: HelpNode = {
  id: HELP_ROOT_ID,
  label: 'Menu principal',
  children: [
    // ─────────────────────────────  0. GUIDE INTERACTIF (CTA permanente)  ─────────────────────────────
    {
      id: HELP_OPEN_TOUR_ID,
      label: 'Revoir le guide complet',
      emoji: '🎓',
      answer:
        "🎓 **Le guide interactif** te présente toutes les fonctionnalités de Gay Social en 10 étapes claires (profil, swipe, messagerie, crédits, sécurité…).\n\n👉 Touche le bouton ci-dessous pour le lancer plein écran.",
    },
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
            "Pour modifier ton **pseudo**, ta **bio**, ton **âge** ou tes préférences :\n\n1. Va dans l'onglet **Profil** (icône en bas à droite)\n2. Touche le bouton **Modifier** en haut\n3. Mets à jour les champs souhaités\n4. Valide avec **Enregistrer**\n\n⏱️ **Limites** :\n• Pseudo et âge : modifiables **1 fois tous les 30 jours**\n• Bio, préférences, photo : modifiables à volonté\n\n💡 Si tu vois le message *« Champ verrouillé »*, c'est que tu l'as déjà modifié récemment. Le compteur se réinitialise automatiquement.\n\n[LINK:/profile]",
          related: ['profile-photo', 'profile-verify', 'profile-visibility'],
        },
        {
          id: 'profile-photo',
          label: 'Ajouter / changer ma photo',
          emoji: '📸',
          answer:
            "**Au moins une photo de profil est obligatoire** pour accéder à l'application (page d'accueil, swipe, messages…).\n\n**Étapes :**\n1. Ouvre ton **Profil**\n2. Touche ta photo actuelle (ou l'icône appareil photo)\n3. Choisis une photo dans ta galerie OU prends-en une nouvelle\n4. Recadre puis valide\n\n✅ **Photos acceptées** : ton visage, tes activités, tes loisirs.\n❌ **Photos refusées** : mineurs, photos volées, contenu interdit, photos floues à outrance.\n\n⏱️ Une nouvelle photo passe par une **modération automatique** (quelques secondes) puis humaine si besoin.\n\n[LINK:/profile]",
          related: ['profile-verify', 'security-report', 'albums-create'],
        },
        {
          id: 'profile-verify',
          label: "Vérification d'identité (badge bleu)",
          emoji: '✅',
          answer:
            "La **vérification d'identité** te donne un **badge bleu** ✅, augmente ta visibilité et rassure les autres membres.\n\n**Étapes :**\n1. **Paramètres → Vérification d'identité**\n2. Photo **recto** de ta pièce d'identité (CNI, permis ou passeport)\n3. Photo **verso** (sauf passeport)\n4. **Selfie** en tenant ta pièce d'identité visible\n5. Soumets la demande\n\n⏱️ **Délai** : 24 à 48 h en moyenne (parfois moins).\n\n🔒 **Confidentialité** : tes documents sont **chiffrés**, **invisibles aux autres membres**, et **automatiquement supprimés** après validation. Seuls les modérateurs assermentés y ont accès.\n\n💡 Si ta demande est refusée, tu reçois un email avec le motif et tu peux la **resoumettre gratuitement**.\n\n[LINK:/profile/verify-identity]",
          related: ['profile-photo', 'security-pin', 'account-export'],
        },
        {
          id: 'profile-visibility',
          label: 'Visibilité de mon profil',
          emoji: '👁️',
          answer:
            "Ton profil est visible uniquement par les **membres vérifiés** ayant au moins une photo. Tu peux affiner cette visibilité :\n\n• **Mode invisible** : tu navigues sans laisser de trace (pas de visite enregistrée). *Paramètres → Confidentialité → Mode invisible*.\n• **Bloquer un profil** : depuis sa fiche → menu ⋮ → Bloquer.\n• **Filtre d'âge** : limite qui peut t'écrire (voir question dédiée).\n• **Masquer ma localisation** : tu n'apparais plus dans l'onglet Proximité.\n\n[LINK:/parametres]",
          related: ['profile-age-filter', 'security-block', 'discover-proximity'],
        },
        {
          id: 'profile-age-filter',
          label: "Filtre d'âge des contacts",
          emoji: '🎯',
          answer:
            "Pour limiter qui peut t'envoyer un message privé selon l'âge :\n\n1. **Paramètres → Contacts**\n2. Active **Filtrer par âge**\n3. Définis ton intervalle (ex : 25-45 ans)\n\nLes membres en dehors de cet intervalle voient ton profil mais **ne peuvent plus t'écrire**.\n\n💡 **Exceptions** : tu peux ajouter des membres autorisés manuellement même s'ils sont hors tranche (depuis leur profil → ⋮ → *Autoriser à m'écrire*).\n\n[LINK:/parametres]",
          related: ['security-block', 'messaging-filter'],
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
            "Tu peux gagner des crédits **sans dépenser un centime** :\n\n• 🌅 **Connexion quotidienne** : +1 crédit / jour (jusqu'à +30/mois)\n• 🤝 **Parrainage** : +30 crédits par filleul inscrit (et +30 pour lui aussi)\n• ✅ **Compléter ton profil** à 100 % : +5 crédits\n• 🎟️ **Codes promo** distribués via flyers, événements, partenaires\n• 🎂 **Cadeaux d'anniversaire** : les autres membres peuvent t'en envoyer\n• 💬 **ChatBot d'accueil** : claim ponctuel disponible\n\n💡 **Astuce** : connecte-toi **chaque jour** à la même heure pour ne pas oublier.\n\n[LINK:/credits]",
          related: ['credits-promo', 'other-referral', 'credits-buy'],
        },
        {
          id: 'credits-buy',
          label: 'Acheter des crédits',
          emoji: '💳',
          answer:
            "Pour acheter des crédits via **PayPal** (sécurisé, pas besoin de carte bancaire) :\n\n1. Va sur la page **Crédits**\n2. Choisis une offre (10, 50, 100, 500, 1000…)\n3. Clique sur **Acheter** puis paie via PayPal\n4. Les crédits sont ajoutés **immédiatement** (en cas de retard, voir « Problème de paiement »)\n\n💡 **Promotions** : pendant les périodes promotionnelles, tu obtiens jusqu'à **+100 % de crédits offerts**. Les promotions actives sont affichées en haut de la page Crédits avec un compte à rebours.\n\n🛡️ **Sécurité** : aucune donnée bancaire n'est stockée sur Gay Social, tout passe par PayPal.\n\n[LINK:/credits]",
          related: ['credits-payment-issue', 'credits-history', 'credits-earn'],
        },
        {
          id: 'credits-history',
          label: 'Solde et historique',
          emoji: '📊',
          answer:
            "Ton solde s'affiche en haut de la page **Crédits** (icône 💎 dans la barre du haut).\n\n**Historique complet :**\n1. Page **Crédits**\n2. Onglet **Historique**\n3. Filtre par type :\n   • 💳 Achats\n   • 💸 Dépenses (boost, médias, accès album…)\n   • 🎁 Bonus (parrainage, connexion, promo)\n   • 💌 Cadeaux reçus / envoyés\n\nChaque ligne est **horodatée** et détaille la raison de la transaction.\n\n[LINK:/credits]",
          related: ['credits-buy', 'credits-payment-issue'],
        },
        {
          id: 'credits-promo',
          label: 'Codes promo & flyers',
          emoji: '🎟️',
          answer:
            "Pour utiliser un **code promo** (flyer, événement, parrainage) :\n\n1. Va sur **Crédits → Code promo**\n2. Saisis le code (sans espace, respecte les majuscules)\n3. Valide\n\nLes crédits offerts s'ajoutent **immédiatement** à ton solde.\n\n⚠️ **Limites** :\n• Un même code = **1 utilisation par compte**\n• Certains codes ont une **date d'expiration**\n• Certains codes ont un **nombre d'utilisations max** (premiers arrivés, premiers servis)\n\n💡 Si le code est refusé, vérifie : la frappe, l'expiration, ou si tu l'as déjà utilisé (Historique → Bonus).\n\n[LINK:/credits]",
          related: ['credits-earn', 'other-referral'],
        },
        {
          id: 'credits-costs',
          label: 'Coût des fonctionnalités',
          emoji: '💰',
          answer:
            "Voici les **coûts indicatifs** (peuvent baisser pendant les promotions) :\n\n• 🚀 **Boost de profil** : 10 crédits / 24 h\n• ⚡ **Selfie éphémère** : 1 crédit\n• 🎁 **Cadeau de crédits** : 1 à 5 crédits offerts\n• 📁 **Création d'album privé** : gratuit\n• 🔓 **Demande d'accès album privé** : 2 crédits (remboursés si refus)\n• 🎤 **Message vocal** : 0,5 à 2 crédits selon durée\n• 💬 **Premier message à un nouveau contact** : gratuit\n• 🗺️ **Groupe régional supplémentaire** : ~5 crédits\n\n📌 Le **coût exact s'affiche toujours avant chaque action**. Aucune dépense surprise possible.",
          related: ['credits-earn', 'credits-buy'],
        },
        {
          id: 'credits-payment-issue',
          label: 'Problème de paiement',
          emoji: '⚠️',
          answer:
            "Si ton paiement PayPal a été débité mais les crédits ne sont pas arrivés :\n\n**1. Vérifie d'abord toi-même :**\n• Page **Crédits → Historique → Achats** : la transaction y figure-t-elle ?\n• Attends **5 minutes** (parfois un délai côté PayPal)\n• Vide le cache et rafraîchis la page\n• Vérifie que le paiement n'est pas en statut « En attente » dans PayPal\n\n**2. Si toujours rien après 10 min**, contacte un agent en gardant ces infos :\n• 📅 Date et heure du paiement\n• 🆔 ID de transaction PayPal (visible dans ton compte PayPal)\n• 💶 Montant\n• 📦 Offre choisie\n\nLe **crédit manuel ou remboursement** est généralement traité sous **24 h ouvrées**.",
          related: ['credits-history', 'credits-buy'],
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
            "Pour envoyer un message privé :\n\n1. Ouvre le **profil** d'un membre\n2. Touche **Envoyer un message**\n3. Rédige et envoie\n\nTu peux aussi accéder à toutes tes conversations depuis l'onglet **Messages** en bas.\n\n💡 **Le premier message est gratuit**. Si la personne te répond, vous pouvez ensuite échanger librement (texte, photos, médias éphémères, cadeaux…).\n\n⚠️ Si tu ne peux pas envoyer de message, vérifie :\n• La personne ne t'a pas **bloqué**\n• Tu es dans sa **tranche d'âge** autorisée\n• Ton compte n'est pas **suspendu**\n\n[LINK:/messages]",
          related: ['messaging-filter', 'messaging-snap', 'messaging-gift'],
        },
        {
          id: 'messaging-filter',
          label: 'Filtres de contact',
          emoji: '🛡️',
          answer:
            "Pour limiter qui peut te contacter :\n\n• 🎯 **Filtre d'âge** : *Paramètres → Contacts → Filtrer par âge*\n• 🚫 **Blocage individuel** : depuis le profil → menu ⋮ → Bloquer\n• 👻 **Mode invisible** : *Paramètres → Confidentialité*\n• 📵 **Pause notifications conv** : depuis la conversation → ⋮ → Couper les notifications\n\nUne personne **bloquée** ne peut plus voir ton profil ni t'écrire (et tu ne vois plus les siens). Tu peux gérer la liste depuis **Paramètres → Membres bloqués**.\n\n[LINK:/parametres]",
          related: ['profile-age-filter', 'security-block', 'security-report'],
        },
        {
          id: 'messaging-gift',
          label: 'Envoyer un cadeau de crédits',
          emoji: '🎁',
          answer:
            "Tu peux **offrir 1 à 5 crédits** à un autre membre directement dans la conversation :\n\n1. Ouvre la conversation\n2. Touche le **+** à gauche du champ de saisie\n3. Choisis **Cadeau**\n4. Sélectionne le montant et confirme\n\nLes crédits sont **immédiatement déduits** de ton solde et ajoutés en bonus au destinataire, qui reçoit une notification.\n\n💡 **Idée** : envoie un cadeau le jour de l'anniversaire d'un membre — il recevra une notification spéciale 🎂.",
          related: ['credits-earn', 'messaging-send'],
        },
        {
          id: 'messaging-snap',
          label: 'Selfies éphémères',
          emoji: '⚡',
          answer:
            "Les **selfies éphémères** disparaissent après visionnage :\n\n1. Dans la conversation, touche **+ → Selfie**\n2. **Appui court** = photo, **appui long** = vidéo (60 s max)\n3. Envoie\n\nLe destinataire ne peut le voir qu'**une seule fois** (pas de replay). Le média est ensuite **supprimé du serveur**.\n\n📷 **Captures d'écran détectées et sanctionnées automatiquement** :\n• 1ʳᵉ → avertissement\n• 2ᵉ → suspension 24 h\n• 3ᵉ → suspension 7 jours\n• Récidive → bannissement\n\n💧 Un filigrane « Gay Social » est ajouté pour décourager le vol.",
          related: ['security-screenshot', 'albums-watermark', 'credits-costs'],
        },
        {
          id: 'messaging-reactions',
          label: 'Réactions et messages épinglés',
          emoji: '📌',
          answer:
            "**Réagir à un message** : appui long sur le message → choisis un emoji (❤️, 👍, 😂, 🔥, 😍…).\n\n**Épingler un message** : appui long → **Épingler**. Les messages épinglés s'affichent en haut de la conversation (utile pour rendez-vous, adresse, lien…).\n\n**Rechercher dans la conversation** : touche la **loupe** dans l'en-tête de la conversation, tape ton mot-clé.\n\n**Répondre à un message** : appui long → **Répondre** (le message d'origine est cité).",
          related: ['messaging-send', 'messaging-autodelete'],
        },
        {
          id: 'messaging-autodelete',
          label: 'Suppression auto',
          emoji: '🗑️',
          answer:
            "Tu peux configurer la **suppression automatique** des messages d'une conversation :\n\n1. Ouvre la conversation\n2. Menu ⋮ → **Suppression auto**\n3. Choisis le délai : 24 h, 7 jours, 30 jours, ou **jamais**\n\n⚠️ **Important** : les messages plus anciens sont masqués **de ton côté uniquement**. La personne en face garde sa copie selon ses propres réglages.\n\n💡 Pour effacer un message **des deux côtés**, utilise *appui long → Supprimer pour tous* (disponible pendant 1 h après envoi).",
          related: ['messaging-send', 'security-pin'],
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
            "Pour créer un album :\n\n1. **Profil → Albums**\n2. Touche **+ Nouvel album**\n3. Donne-lui un nom et choisis **Public** ou **Privé**\n4. Ajoute des photos/vidéos depuis ta galerie\n\n✨ Tu peux créer **autant d'albums que tu veux**, **gratuitement**, sans limite de stockage raisonnable.\n\n💡 Tu peux **réorganiser** tes albums (drag & drop) et **changer leur visibilité** à tout moment.\n\n[LINK:/profile]",
          related: ['albums-public-private', 'albums-share', 'profile-photo'],
        },
        {
          id: 'albums-public-private',
          label: 'Public vs Privé',
          emoji: '🔐',
          answer:
            "**Album public** 🌍 : visible par tous les membres directement sur ton profil.\n\n**Album privé** 🔒 : aperçu **flouté**, accessible uniquement aux personnes à qui tu as donné l'accès. Idéal pour le contenu sensible ou intime.\n\n🔄 Tu peux **changer la visibilité** d'un album à tout moment :\n• Profil → Albums → ⋮ → *Modifier la visibilité*\n• Le changement est **immédiat** pour tous les membres\n\n⚠️ Passer un album **public → privé** retire automatiquement l'accès aux personnes qui l'avaient déjà consulté.",
          related: ['albums-share', 'albums-request', 'albums-watermark'],
        },
        {
          id: 'albums-share',
          label: 'Partager un album',
          emoji: '📤',
          answer:
            "Pour partager un album dans une conversation :\n\n1. Ouvre la conversation\n2. Touche **+ → Album**\n3. Sélectionne l'album à partager\n4. Définis la **durée d'accès** : 1 h, 24 h, 7 jours, ou illimité\n\nLa personne reçoit un message avec un **bouton d'accès direct**.\n\n🛑 **Tu peux arrêter le partage à tout moment** :\n• Ouvre la conversation → message d'album → **Arrêter le partage**\n• L'accès est **révoqué immédiatement**\n\n💡 Tu vois la **liste de toutes tes partages actifs** dans : *Profil → Albums → ⋮ → Partages actifs*.",
          related: ['albums-public-private', 'albums-request', 'security-block'],
        },
        {
          id: 'albums-request',
          label: "Demander l'accès à un album privé",
          emoji: '🔓',
          answer:
            "Si un membre a un album privé, tu peux **demander l'accès** :\n\n1. Va sur son profil → onglet **Albums**\n2. Touche l'album privé (icône 🔒)\n3. Confirme la demande (**2 crédits**)\n\nLe propriétaire reçoit ta demande **dans la conversation** et peut :\n• ✅ **Accepter** (durée et accès personnalisables)\n• ❌ **Refuser** (tes 2 crédits te sont **automatiquement remboursés**)\n• ⏳ **Ignorer** (la demande expire après 7 jours, crédits remboursés)\n\n💡 **Une fois accepté**, tu vois l'album sans avoir à redemander, sauf révocation.",
          related: ['albums-public-private', 'credits-costs'],
        },
        {
          id: 'albums-watermark',
          label: 'Filigrane et protection',
          emoji: '💧',
          answer:
            "Toutes les photos affichent un **filigrane « Gay Social »** semi-transparent pour décourager le vol et la diffusion.\n\n🛡️ **Protections en place :**\n• 📷 **Captures d'écran** détectées et sanctionnées (voir Sécurité)\n• 🔒 Médias stockés dans des **buckets privés sécurisés** (URLs signées temporaires)\n• ⚡ Selfies éphémères **supprimés après visionnage**\n• 👮 Aucun téléchargement direct possible depuis l'application\n\n⚠️ Malgré ces protections, **réfléchis bien avant de partager du contenu sensible**. Aucune protection technique n'est infaillible (photo prise par un autre appareil, etc.).",
          related: ['security-screenshot', 'security-report', 'messaging-snap'],
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
            "Le **Swipe** te présente des profils un par un :\n\n• **Glisse à droite** ❤️ pour liker\n• **Glisse à gauche** ❌ pour passer\n• Touche le profil pour voir les détails\n• Bouton **↩️ Retour** pour revenir au profil précédent (premium)\n\n💞 Si deux personnes se likent mutuellement, c'est un **match** ! Tu reçois une notification et tu peux démarrer une conversation directement.\n\n💡 Plus tu likes activement, plus l'algorithme affine les profils proposés. **Booste ton profil** pour apparaître en priorité chez les autres.\n\n[LINK:/swipe]",
          related: ['discover-proximity', 'discover-boost', 'discover-favorites'],
        },
        {
          id: 'discover-proximity',
          label: 'Onglet Proximité',
          emoji: '📍',
          answer:
            "L'onglet **Proximité** affiche les membres autour de toi en temps réel :\n\n• 📡 **Géolocalisation requise** (autorise-la dans ton navigateur ou les paramètres système)\n• 📏 Choisis ton **rayon** : 1 km à 200 km\n• 🔥 Badge **« Très proche »** si < 100 m\n\n⚠️ Si tu **refuses la géolocalisation**, l'onglet est désactivé. Les profils sans géoloc activée n'apparaissent pas dans cette liste.\n\n💡 **Astuce iPhone** : Réglages → Safari → Localisation → Demander. Sur Android : Paramètres → Apps → Chrome → Autorisations.\n\n[LINK:/home]",
          related: ['profile-visibility', 'discover-swipe'],
        },
        {
          id: 'discover-boost',
          label: 'Boost de profil',
          emoji: '🚀',
          answer:
            "Le **Boost** met ton profil en avant pendant **24 h** sur la page Swipe :\n\n• 💰 **Coût** : 10 crédits\n• 🔝 Tu apparais en **priorité** dans la pile des autres membres\n• ⚡ Ton profil est **mis en évidence** (bordure dorée + badge)\n• 📈 Idéal pour augmenter tes matchs rapidement\n\n**Activation** : Profil → bouton **🚀 Boost mon profil**.\n\n💡 Le Boost est cumulable avec les **promotions de crédits** : achète un pack pendant une promo et boost à moindre coût.",
          related: ['credits-earn', 'discover-swipe', 'credits-buy'],
        },
        {
          id: 'discover-visits',
          label: 'Visites de profil',
          emoji: '👀',
          answer:
            "Chaque visite de ton profil est enregistrée. Pour voir qui a consulté ton profil :\n\n1. **Accueil → Visites**\n2. Liste des derniers visiteurs avec **date et heure**\n\n👻 Tu peux **désactiver l'enregistrement de tes propres visites** :\n• *Paramètres → Confidentialité → Mode invisible*\n• Activé : tu navigues sans laisser de trace (tu ne vois plus tes visiteurs non plus)\n\n💡 Les **profils en mode invisible** apparaissent comme « Visiteur anonyme » dans ta liste.",
          related: ['profile-visibility', 'discover-favorites'],
        },
        {
          id: 'discover-favorites',
          label: 'Favoris',
          emoji: '⭐',
          answer:
            "Pour ajouter un membre aux **favoris** :\n\n1. Ouvre son profil\n2. Touche l'icône **étoile ⭐**\n\nTes favoris sont accessibles depuis l'onglet **Accueil → Favoris**. \n\n🔕 La personne **n'est pas notifiée** que tu l'as mise en favori — c'est totalement discret.\n\n💡 Tu peux retirer un membre des favoris en re-touchant l'étoile (qui devient blanche).",
          related: ['discover-visits', 'discover-swipe'],
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
            "**101 groupes régionaux** (un par département français) sont disponibles :\n\n1. Va dans **Messages → Groupes**\n2. Touche **Rejoindre un groupe**\n3. Choisis ta région (ex : *Bouches-du-Rhône (13)*)\n\n🎁 Le **premier groupe est gratuit**. Les groupes supplémentaires coûtent quelques crédits (généralement ~5).\n\n💡 Tu peux **quitter** un groupe à tout moment depuis ses paramètres. Tu peux aussi **couper les notifications** sans le quitter.\n\n[LINK:/messages]",
          related: ['groups-create', 'groups-mute', 'credits-costs'],
        },
        {
          id: 'groups-create',
          label: 'Créer un groupe personnalisé',
          emoji: '✨',
          answer:
            "Pour créer ton propre groupe (thématique, événement, communauté…) :\n\n1. **Messages → Groupes → +**\n2. Donne-lui un **nom**, une **description**, une **photo**\n3. Définis-le **Public** ou **Privé** (sur invitation)\n4. **Invite des membres** depuis ta liste de contacts\n\n👑 Tu deviens **administrateur** du groupe. Tu peux :\n• Retirer/ajouter des membres\n• Nommer des **co-modérateurs**\n• Modifier nom/description/photo\n• Supprimer le groupe (action irréversible)",
          related: ['groups-moderate', 'groups-polls', 'groups-join'],
        },
        {
          id: 'groups-moderate',
          label: 'Modérer un groupe',
          emoji: '🛡️',
          answer:
            "En tant que **créateur ou modérateur** d'un groupe :\n\n• 🗑️ **Supprimer un message** : appui long → **Supprimer**\n• 👤 **Retirer un membre** : liste membres → menu ⋮ → Exclure\n• ⚙️ **Modifier nom/photo/description** : Paramètres du groupe\n• 🔒 **Verrouiller un sondage** une fois la décision prise\n• 📌 **Épingler un message** important pour tous\n\n🚨 Les membres peuvent te **signaler** aux administrateurs Gay Social en cas d'abus de pouvoir. Reste juste et bienveillant.",
          related: ['groups-create', 'security-report'],
        },
        {
          id: 'groups-polls',
          label: 'Sondages et événements',
          emoji: '📊',
          answer:
            "Dans un groupe, tu peux créer :\n\n📊 **Sondages** : touche **+ → Sondage**, ajoute des options. Choix unique ou multiple. Les résultats s'affichent en temps réel et tu peux **verrouiller** quand la décision est prise.\n\n📅 **Événements** : touche **+ → Événement**, indique :\n• 📌 Lieu\n• 🕐 Date et heure\n• 📝 Description\n\nLes membres répondent **Présent / Peut-être / Absent**. Un **rappel automatique** est envoyé 24 h avant.\n\n💡 Les événements apparaissent dans le calendrier du groupe, accessible via le menu ⋮.",
          related: ['groups-moderate', 'groups-create'],
        },
        {
          id: 'groups-mute',
          label: 'Couper les notifications',
          emoji: '🔕',
          answer:
            "Pour ne plus recevoir de notifications d'un groupe **sans le quitter** :\n\n1. Ouvre le groupe\n2. Menu ⋮ → **Couper les notifications**\n3. Choisis la durée : 1 h, 8 h, 24 h, 1 semaine, ou **indéfiniment**\n\nTu restes membre, tu peux toujours consulter le groupe, mais aucune notification push ne te réveillera.\n\n💡 Pour réactiver, retourne dans le menu ⋮ et désactive l'option.",
          related: ['groups-join', 'messaging-filter'],
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
            "Pour bloquer un membre :\n\n1. Va sur son profil\n2. Menu ⋮ → **Bloquer**\n3. Confirme\n\n**Conséquences immédiates :**\n• 🚷 Il **ne peut plus voir ton profil**\n• 💬 Vos conversations sont **masquées** des deux côtés\n• 📵 Il ne peut **plus t'écrire ni te signaler**\n• 👻 Tu disparais de ses résultats de recherche\n\n♻️ **Débloquer** : *Paramètres → Membres bloqués → ⋮ → Débloquer*. Tu peux le refaire à tout moment.\n\n⚠️ Les **administrateurs et modérateurs** ne peuvent pas être bloqués (raisons de modération).",
          related: ['security-report', 'messaging-filter', 'profile-visibility'],
        },
        {
          id: 'security-report',
          label: 'Signaler un membre',
          emoji: '🚨',
          answer:
            "Pour signaler un comportement inapproprié :\n\n1. Va sur le profil concerné\n2. Menu ⋮ → **Signaler**\n3. Choisis le motif :\n   • Harcèlement / insultes\n   • Faux profil / usurpation\n   • Photo volée ou inappropriée\n   • Contenu illégal (mineurs, drogue…)\n   • Spam / arnaque\n4. Détaille si besoin (capture d'écran utile)\n\n👮 L'équipe de **modération** examine **chaque signalement** sous 24 h. Les abus sont sanctionnés progressivement (avertissement → suspension → bannissement définitif).\n\n🔒 **Anonymat** : la personne signalée **ne sait jamais** qui l'a signalée.",
          related: ['security-block', 'security-words', 'security-screenshot'],
        },
        {
          id: 'security-screenshot',
          label: 'Captures d\'écran',
          emoji: '📷',
          answer:
            "Les **captures d'écran** dans les conversations privées et sur les selfies éphémères sont **détectées automatiquement**.\n\n⚖️ **Sanctions progressives** :\n• 1ʳᵉ capture : **avertissement** (notification + email)\n• 2ᵉ capture : **suspension 24 h**\n• 3ᵉ capture : **suspension 7 jours**\n• Récidive : **bannissement définitif** sans remboursement crédits\n\n📲 La détection fonctionne sur **iOS, Android et navigateurs desktop** (via API et heuristiques).\n\n💡 Capturer du contenu privé d'autrui est une **atteinte au respect** et peut constituer un **délit pénal** (article 226-1 du Code pénal).",
          related: ['security-report', 'messaging-snap', 'albums-watermark'],
        },
        {
          id: 'security-pin',
          label: 'Verrouillage PIN / biométrie',
          emoji: '🔐',
          answer:
            "Active un **code PIN à 6 chiffres** ou la **biométrie** (empreinte/visage) pour protéger l'accès à l'application :\n\n1. **Paramètres → Sécurité**\n2. Active **Verrouillage de l'app**\n3. Définis ton PIN à 6 chiffres\n4. (Optionnel) Active aussi la **biométrie**\n\n🔓 Le verrouillage s'active à **chaque ouverture** de l'application (utile sur téléphone partagé).\n\n⚠️ **Si tu oublies ton PIN** : tu peux le réinitialiser via l'email associé à ton compte (lien envoyé après vérification de sécurité).",
          related: ['account-password', 'security-cookies'],
        },
        {
          id: 'security-cookies',
          label: 'Cookies et données',
          emoji: '🍪',
          answer:
            "Tu peux gérer ton consentement aux **cookies** à tout moment :\n\n1. **Paramètres → Confidentialité → Cookies**\n2. Active/désactive par catégorie :\n   • ✅ Essentiels (toujours actifs, nécessaires au fonctionnement)\n   • 📊 Statistiques (anonymes, optionnels)\n   • 📣 Publicité (optionnels)\n\n📜 Consulte aussi notre **politique de confidentialité** et nos **règles de conduite** pour comprendre comment tes données sont traitées (RGPD).\n\n[LINK:/regles]",
          related: ['account-export', 'security-pin'],
        },
        {
          id: 'security-words',
          label: 'Mots interdits',
          emoji: '🛑',
          answer:
            "Le système détecte automatiquement les **mots interdits** dans les messages :\n\n• Insultes, propos haineux\n• Contenu illégal (drogue, mineurs, armes…)\n• Tentatives de **contournement** (chiffres à la place de lettres, etc.)\n\n**Que se passe-t-il ?**\n• Le message **n'est pas envoyé**\n• Tu reçois un **avertissement** dans le chat\n• Les abus répétés peuvent entraîner une **suspension automatique**\n\n💡 Si tu penses qu'un faux positif a bloqué un message légitime, **contacte un agent** avec une capture d'écran.\n\n[LINK:/regles]",
          related: ['security-report', 'security-screenshot'],
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
            "Le **compte couple** permet à deux utilisateurs de partager **un même login** tout en gardant leur **identité propre** (deux pseudos, deux profils visibles) :\n\n1. **Paramètres → Compte couple**\n2. Touche **Créer un compte couple**\n3. Tu reçois un **code d'invitation à 6 caractères**\n\nTon partenaire l'utilisera pour rejoindre le compte (voir « Inviter mon partenaire »).\n\n💡 **Avantages** : un seul abonnement, conversations partageables, gestion conjointe des crédits.",
          related: ['couple-invite', 'couple-share', 'couple-leave'],
        },
        {
          id: 'couple-invite',
          label: 'Inviter mon partenaire',
          emoji: '💌',
          answer:
            "Une fois ton compte couple créé :\n\n1. **Partage le code d'invitation** à ton partenaire (SMS, email, en personne…)\n2. Il se connecte sur Gay Social → **Paramètres → Rejoindre un compte couple**\n3. Il **saisit le code** reçu\n4. Tu reçois une **notification** pour valider la liaison\n\n✅ Une fois validé, vous êtes **connectés** et le compte couple est actif.\n\n⏱️ Le code d'invitation **expire après 7 jours**. Tu peux en générer un nouveau à tout moment.",
          related: ['couple-create', 'couple-share'],
        },
        {
          id: 'couple-share',
          label: 'Partager les conversations',
          emoji: '👥',
          answer:
            "Tu peux choisir si **les conversations sont partagées** entre les deux partenaires :\n\n1. **Paramètres → Compte couple**\n2. Active/désactive **Partager les conversations**\n\n🔄 Si **activé** : vous voyez tous les deux les mêmes messages reçus et envoyés (utile pour les couples ouverts/transparents).\n\n🔒 Si **désactivé** : chacun garde sa messagerie privée.\n\n💡 Le réglage est **modifiable à tout moment**, et s'applique aux **nouvelles conversations**. Les anciennes conservent leur paramétrage initial.",
          related: ['couple-create', 'couple-leave'],
        },
        {
          id: 'couple-leave',
          label: 'Quitter le compte couple',
          emoji: '🚪',
          answer:
            "Pour dissoudre un compte couple :\n\n1. **Paramètres → Compte couple**\n2. Touche **Quitter le compte couple**\n3. Confirme avec ton mot de passe\n\n**Conséquences :**\n• 🔓 Les deux comptes redeviennent **indépendants**\n• 💬 L'historique des conversations partagées est **conservé du côté du créateur**\n• 💎 Le solde de crédits reste **du côté du créateur** (sauf accord préalable)\n• 📨 Les autres membres voient à nouveau **deux profils distincts**\n\n⚠️ Action **irréversible** : pour reformer un compte couple, il faudra refaire la procédure complète.",
          related: ['couple-create', 'account-suspend'],
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
            "Pour changer ton mot de passe :\n\n1. **Paramètres → Sécurité → Mot de passe**\n2. Saisis ton **mot de passe actuel**\n3. Saisis le **nouveau** (min. 8 caractères, recommandé : maj + min + chiffre + symbole)\n4. **Confirme**\n\n🔄 Si tu l'as **oublié**, utilise **« Mot de passe oublié »** sur la page de connexion. Un email de réinitialisation est envoyé sous 5 min (vérifie aussi tes spams).\n\n💡 Active aussi le **verrouillage PIN** pour une double protection.",
          related: ['security-pin', 'account-email'],
        },
        {
          id: 'account-email',
          label: 'Changer mon email',
          emoji: '📧',
          answer:
            "Pour changer ton adresse email :\n\n1. **Paramètres → Compte → Email**\n2. Saisis la **nouvelle adresse**\n3. Confirme via le **lien envoyé** sur la nouvelle adresse (valable 24 h)\n\n⏳ L'**ancienne adresse** reste valide tant que tu n'as pas confirmé la nouvelle. Tu reçois un email d'alerte sur l'ancienne pour des raisons de sécurité.\n\n💡 Si tu n'as plus accès à ton ancien email, **contacte un agent** avec une preuve d'identité (la même que pour la vérification badge bleu).",
          related: ['account-password', 'profile-verify'],
        },
        {
          id: 'account-suspend',
          label: 'Suspendre mon compte',
          emoji: '⏸️',
          answer:
            "Tu peux **suspendre temporairement** ton compte (pause) sans le supprimer :\n\n1. **Paramètres → Compte → Suspendre**\n2. Confirme\n\n**Pendant la suspension :**\n• 👻 Ton profil n'est **plus visible**\n• 📵 Tu ne reçois **plus de messages ni de notifications**\n• 💎 Tes crédits sont **conservés**\n• 📁 Tes albums et conversations sont **intacts**\n\n♻️ **Réactivation** : il suffit de te **reconnecter** — tout est immédiatement restauré.\n\n💡 Idéal pour faire une pause sans perdre tes données ni tes crédits.",
          related: ['account-delete', 'account-export'],
        },
        {
          id: 'account-delete',
          label: 'Supprimer mon compte',
          emoji: '🗑️',
          answer:
            "Pour **supprimer définitivement** ton compte :\n\n1. **Paramètres → Compte → Supprimer mon compte**\n2. Confirme avec ton mot de passe\n3. (Optionnel) Indique le motif\n\n⏱️ **Délai de réflexion de 30 jours** avant suppression définitive :\n• Tu peux **annuler** en te reconnectant pendant cette période\n• Après 30 jours, **toutes tes données sont effacées** (profil, albums, messages, crédits)\n• La suppression est **irréversible**\n\n💡 Avant de supprimer, pense à **exporter tes données (RGPD)** et envisage la **suspension temporaire** si tu veux juste faire une pause.",
          related: ['account-suspend', 'account-export'],
        },
        {
          id: 'account-export',
          label: 'Exporter mes données (RGPD)',
          emoji: '📦',
          answer:
            "Tu peux télécharger **toutes tes données personnelles** dans une archive ZIP (droit RGPD) :\n\n1. **Paramètres → Compte → Exporter mes données**\n2. Touche **Demander l'export**\n3. Tu reçois un email avec un **lien de téléchargement** sous **24 h** (souvent quelques minutes)\n\n📦 **L'archive contient :**\n• 👤 Profil complet et préférences\n• 💬 Tous les messages (privés et groupes)\n• 📁 Albums et médias\n• 💎 Historique des transactions et crédits\n• 📊 Logs de connexion\n\n🔒 Le **lien expire après 7 jours** pour des raisons de sécurité.",
          related: ['account-delete', 'security-cookies'],
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
            "Les **modérateurs Gay Social** sont **rémunérés à la mission** :\n\n• ✅ Vérification d'identité : **0,50 €** / dossier\n• 💬 Support chat utilisateur : **0,05 €** / ticket\n• 🚨 Modération de contenu signalé : **0,03 €** / décision\n\n📅 Les recrutements sont **ponctuels** et annoncés via le **Canal Informations** dans tes messages. Les critères : profil vérifié, pas de sanction, ancienneté > 3 mois.\n\n💡 Si tu es intéressé, **contacte un agent** en précisant ta motivation, ton expérience éventuelle de modération et ta disponibilité.",
          related: ['profile-verify', 'other-support'],
        },
        {
          id: 'other-ads',
          label: 'Acheter un espace publicitaire',
          emoji: '📣',
          answer:
            "Tu peux promouvoir un **commerce LGBT-friendly**, un **événement** ou un **service** via notre **portail annonceur** :\n\n• 🎨 **Multi-formats** : bannières, cartes natives, vignettes\n• 🗺️ **Ciblage géographique** par codes postaux\n• 💶 Tarif au **clic** ou à l'**impression** (CPC ou CPM)\n• 📊 Tableau de bord avec statistiques temps réel\n• 💳 Portefeuille rechargeable via PayPal\n\n📞 **Contacte un agent** pour obtenir l'accès au portail annonceur et un devis personnalisé.",
          related: ['other-support', 'credits-buy'],
        },
        {
          id: 'other-referral',
          label: 'Système de parrainage',
          emoji: '🤝',
          answer:
            "**Parraine tes amis** et gagne des crédits :\n\n1. **Paramètres → Parrainage**\n2. Récupère ton **lien unique** ou ton **code**\n3. Partage-le (SMS, réseaux sociaux, en personne)\n\n🎁 Quand un ami s'inscrit via ton lien et **complète son profil** :\n• 🎁 **Toi** : +30 crédits\n• 🎁 **Lui** : +30 crédits\n\n♾️ **Aucune limite** au nombre de filleuls.\n\n💡 Tu peux suivre tes parrainages en temps réel : *Paramètres → Parrainage → Mes filleuls*.",
          related: ['credits-earn', 'credits-promo'],
        },
        {
          id: 'other-pwa',
          label: 'Application mobile (PWA)',
          emoji: '📱',
          answer:
            "Gay Social est une **PWA** (Progressive Web App) : tu peux l'installer comme une vraie application sans passer par les stores.\n\n📱 **iPhone (Safari)** :\n1. Touche **Partager** (icône carré + flèche)\n2. **Ajouter à l'écran d'accueil**\n3. Confirme avec **Ajouter**\n\n🤖 **Android (Chrome)** :\n1. Menu **⋮** en haut à droite\n2. **Installer l'application**\n3. Confirme\n\n✨ **Une fois installée :**\n• Plein écran (sans barre du navigateur)\n• Notifications push\n• Fonctionne en arrière-plan\n• Icône sur l'écran d'accueil",
          related: ['other-support'],
        },
        {
          id: 'other-support',
          label: 'Contacter le support',
          emoji: '💬',
          answer:
            "Tu n'as pas trouvé de réponse à ta question dans cette aide ?\n\n👤 Touche le bouton **« Parler à un agent »** en bas de l'écran. Un conseiller te répondra dès qu'il est disponible (généralement sous **quelques minutes** en heures ouvrées).\n\n💡 **Pour un traitement plus rapide**, prépare :\n• 📝 Une description **claire et précise** du problème\n• 📅 La **date/heure** approximative du souci\n• 📷 Une **capture d'écran** si possible\n• 🆔 L'**ID de transaction** (en cas de problème de paiement)\n\n🕐 Le délai d'attente moyen et ta position dans la file s'affichent en temps réel.",
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

/** Renvoie le parent direct d'un node, ou null si racine/introuvable */
export function findParentNode(id: string, root: HelpNode = HELP_FLOW): HelpNode | null {
  if (!root.children) return null;
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParentNode(id, child);
    if (found) return found;
  }
  return null;
}
