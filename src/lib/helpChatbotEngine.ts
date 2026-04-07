/**
 * Help Chatbot Knowledge Engine
 * Rule-based, keyword-matching chatbot — NO AI.
 * Matches user queries against FAQ articles + static site knowledge.
 */

// ─── Synonyms / keyword expansion ────────────────────────────────────
const SYNONYM_MAP: Record<string, string[]> = {
  // Account
  compte: ['profil', 'inscription', 'connexion', 'login', 'parametres', 'parametre', 'inscrire', 'connecter', 'deconnecter', 'mot de passe', 'mdp', 'email', 'supprimer'],
  profil: ['compte', 'photo', 'avatar', 'bio', 'pseudo', 'nom', 'infos', 'modifier'],
  supprimer: ['effacer', 'retirer', 'enlever', 'desactiver', 'fermer', 'annuler'],
  inscription: ['inscrire', 'creer', 'nouveau', 'rejoindre', 'commencer'],
  connexion: ['connecter', 'login', 'entrer', 'ouvrir'],
  deconnexion: ['deconnecter', 'logout', 'sortir', 'quitter'],
  'mot de passe': ['mdp', 'password', 'oublie', 'reinitialiser', 'changer'],

  // Credits
  credit: ['credits', 'piece', 'pieces', 'monnaie', 'solde', 'acheter', 'payer', 'gratuit', 'recharge', 'quotidien', 'passif', 'bonus', 'promo', 'promotion', 'tarif', 'dynamique'],
  acheter: ['achat', 'payer', 'paypal', 'prix', 'tarif', 'cout', 'carte'],
  gratuit: ['gratis', 'offert', 'cadeau', 'free', 'sans payer'],
  parrainage: ['parrain', 'filleul', 'code', 'referral', 'inviter', 'invitation', 'parrainer'],
  promo: ['promotion', 'reduction', 'boost', 'boostee', 'accelere', 'reduit', 'offre'],

  // Verification
  verification: ['verifier', 'verif', 'verifie', 'identite', 'carte', 'document', 'piece d\'identite', 'selfie', 'photo', 'approuve', 'badge'],
  identite: ['identite', 'cni', 'passeport', 'carte identite', 'piece identite'],

  // Messaging
  message: ['messages', 'msg', 'conversation', 'discuter', 'parler', 'ecrire', 'envoyer', 'mp', 'prive', 'dm'],
  chat: ['discussion', 'salon', 'tchat', 'groupe', 'departement', 'region'],
  ephemere: ['ephemeres', 'disparait', 'temporaire', 'snap', 'photo temporaire'],
  blocage: ['bloquer', 'bloque', 'debloquer', 'ignorer', 'signaler'],
  signalement: ['signaler', 'report', 'abusif', 'harcelement', 'insulte', 'spam'],

  // Features
  swipe: ['match', 'like', 'liker', 'matcher', 'rencontre', 'compatible', 'decouvrir'],
  favori: ['favoris', 'aimer', 'sauvegarder', 'enregistrer'],
  story: ['stories', 'histoire', 'publication', 'publier'],
  album: ['albums', 'galerie', 'photos', 'images', 'partager album'],
  notification: ['notifications', 'notif', 'alerte', 'push', 'son'],
  tween: ['tweens', 'tweet', 'publication', 'poster', 'fil', 'actualite', 'fil actualite', 'sondage'],

  // Home
  accueil: ['home', 'proximite', 'favoris', 'visites', 'reactions', 'nearby', 'proche'],
  visite: ['visites', 'visiteur', 'qui visite', 'vu mon profil'],
  reaction: ['reactions', 'reagir', 'emoji', 'coeur', 'like profil'],

  // Security
  securite: ['protection', 'confidentialite', 'prive', 'donnees', 'rgpd', 'capture', 'screenshot', 'fraude', 'hack', 'vol', 'pin', 'empreinte', 'biometrie', 'verrouillage'],
  capture: ['screenshot', 'capture ecran', 'screener'],
  avatar: ['photo profil', 'image profil', 'pp', 'photo de profil'],
  publicite: ['pub', 'annonce', 'banniere', 'ad', 'sans pub', 'ad free'],
  pin: ['code pin', 'verrouillage', 'empreinte', 'biometrie', 'touch id', 'face id', 'fingerprint', 'verrou'],

  // Premium
  premium: ['abonnement', 'vip', 'abo', 'avantage', 'offre'],

  // Moderation
  moderation: ['moderateur', 'signaler', 'report', 'sanctions', 'ban', 'suspension', 'avertissement', 'regles'],

  // Data
  donnees: ['rgpd', 'export', 'telecharger', 'telechargement', 'archives', 'sauvegarde', 'exporter'],

  // Technical
  bug: ['probleme', 'erreur', 'marche pas', 'fonctionne pas', 'plante', 'crash', 'lent', 'charge'],
  application: ['app', 'appli', 'mobile', 'telephone', 'pwa', 'installer'],

  // Archives
  archive: ['archives', 'archiver', 'archivee', 'conversations archivees'],
};

// ─── Static site knowledge (always available, no DB needed) ───────────
export interface StaticKnowledge {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  link?: string; // Navigation link
}

export const STATIC_KNOWLEDGE: StaticKnowledge[] = [
  // ═══════════════════════════════════════════════════════
  // GÉNÉRAL
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-what-is-gc',
    category: 'Général',
    question: "Qu'est-ce que Gay Social ?",
    answer: "**Gay Social** est un site de rencontre gay **100% français**, organisé par **101 départements**. L'inscription est **gratuite**, les profils sont **vérifiés par pièce d'identité**, et il n'y a **aucune publicité**. Le site est réservé aux **+18 ans**.",
    keywords: ['gaysocial', 'gay social', 'site', 'quoi', 'cest quoi', 'presentation', 'a propos'],
  },
  {
    id: 'static-features',
    category: 'Fonctionnalités',
    question: 'Quelles sont les fonctionnalités disponibles ?',
    answer: "Gay Social propose :\n\n• **Chat de groupe** par département (101 salons)\n• **Messages privés** entre membres\n• **Swipe / Match** pour trouver des profils compatibles\n• **Albums photos** privés avec partage sélectif\n• **Tween** — fil d'actualité pour publier, commenter et interagir\n• **Médias éphémères** (photos/vidéos qui disparaissent après consultation)\n• **Groupes thématiques** personnalisés\n• **Protection anti-capture d'écran**\n• **ChatBot personnel** configurable sur votre profil\n• **Vérification d'identité** pour plus de sécurité\n• **Code PIN / Empreinte digitale** pour protéger l'accès\n\n📱 Accédez à toutes ces fonctionnalités depuis la barre de navigation.",
    keywords: ['fonctionnalites', 'features', 'options', 'quoi faire', 'possible', 'disponible'],
  },

  // ═══════════════════════════════════════════════════════
  // ACCUEIL
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-home-page',
    category: 'Accueil',
    question: "Comment fonctionne la page d'accueil ?",
    answer: "La page d'**accueil** est organisée en **4 onglets** :\n\n1. **📍 Proximité** — Découvrez les membres proches de vous géographiquement. Activez la géolocalisation pour voir les profils autour de vous.\n2. **⭐ Favoris** — Retrouvez tous les profils que vous avez ajoutés en favoris.\n3. **👁️ Visites** — Voyez qui a visité votre profil récemment (avec badge compteur).\n4. **💜 Réactions** — Consultez les réactions reçues sur votre profil (avec badge compteur).\n\n🔍 Un **filtre d'âge** est accessible directement à droite de la barre d'onglets pour affiner vos résultats.\n\n⚠️ Pour apparaître sur la page d'accueil, vous devez avoir une **photo de profil** validée.",
    keywords: ['accueil', 'home', 'page principale', 'onglets', 'proximite', 'favoris', 'visites', 'reactions'],
    link: '/',
  },
  {
    id: 'static-nearby',
    category: 'Accueil',
    question: 'Comment voir les membres proches de moi ?',
    answer: "La fonctionnalité **À proximité** vous montre les membres géographiquement proches :\n\n• Activez la **géolocalisation** dans votre navigateur\n• Consultez l'onglet **Proximité** depuis l'accueil\n• Les distances sont calculées en **kilomètres**\n• Le déblocage peut nécessiter des **crédits**\n\n📍 Votre position exacte n'est **jamais partagée** avec les autres membres.\n\n⚠️ Pour être visible, vous devez avoir une **photo de profil** approuvée.",
    keywords: ['proximite', 'proche', 'pres', 'geolocalisation', 'localisation', 'distance', 'km', 'autour'],
    link: '/',
  },
  {
    id: 'static-favorites',
    category: 'Accueil',
    question: 'Comment fonctionnent les favoris ?',
    answer: "L'onglet **Favoris** de l'accueil regroupe tous les profils que vous avez mis en favoris :\n\n• Ajoutez un profil en favori depuis sa page de profil (icône ⭐)\n• Retrouvez-les facilement depuis l'onglet **Favoris**\n• La liste est toujours à jour et triée par date d'ajout\n\n💡 C'est un moyen rapide de retrouver les profils qui vous intéressent !",
    keywords: ['favoris', 'favori', 'sauvegarder', 'enregistrer', 'etoile', 'bookmark'],
    link: '/',
  },
  {
    id: 'static-visits',
    category: 'Accueil',
    question: 'Comment voir qui a visité mon profil ?',
    answer: "L'onglet **Visites** affiche la liste des membres qui ont consulté votre profil :\n\n• Un **badge compteur** indique le nombre de nouvelles visites\n• Cliquez sur un profil pour le consulter à votre tour\n• Les visites sont triées par **date** (les plus récentes en premier)\n\n👁️ C'est un excellent moyen de découvrir qui s'intéresse à vous !",
    keywords: ['visites', 'visiteur', 'qui visite', 'vu mon profil', 'consulte', 'regarde'],
    link: '/',
  },
  {
    id: 'static-reactions',
    category: 'Accueil',
    question: 'Comment fonctionnent les réactions de profil ?',
    answer: "L'onglet **Réactions** montre toutes les réactions reçues sur votre profil :\n\n• Les autres membres peuvent réagir avec des **emojis** sur votre profil\n• Un **badge compteur** s'affiche pour les nouvelles réactions\n• Consultez qui a réagi et avec quel emoji\n\n💜 Les réactions sont un moyen fun de montrer votre intérêt !",
    keywords: ['reactions', 'reaction', 'emoji', 'reagir', 'coeur', 'like profil'],
    link: '/',
  },

  // ═══════════════════════════════════════════════════════
  // TWEEN
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-tween',
    category: 'Tween',
    question: "Comment fonctionne la page Tween ?",
    answer: "**Tween** est le fil d'actualité de Gay Social, inspiré de X (Twitter) :\n\n📝 **Publier** :\n• Rédigez des messages de **300 caractères max** (indicateur de progression circulaire)\n• Ajoutez des **photos** ou **vidéos** (jusqu'à 10 min / 100 Mo)\n• Créez des **sondages** pour interagir avec la communauté\n• Utilisez le **gras** avec **texte** dans vos publications\n\n💬 **Interagir** :\n• **Commentez** les publications (cliquez sur l'icône 💬)\n• **Likez** et **partagez** les contenus\n• Cliquez sur l'**avatar** ou le **nom** d'un membre pour accéder à son profil\n\n📋 **Mes Tween** :\n• Retrouvez toutes vos publications depuis l'onglet **Mes Tween** sur votre profil\n\n📢 Des bannières publicitaires sont insérées après la 3ème publication du flux.",
    keywords: ['tween', 'tweens', 'fil', 'actualite', 'publier', 'poster', 'publication', 'sondage', 'commentaire'],
    link: '/tween',
  },
  {
    id: 'static-tween-create',
    category: 'Tween',
    question: "Comment publier un Tween ?",
    answer: "Pour publier un Tween :\n\n1. Allez sur la page **Tween** depuis la barre de navigation\n2. Cliquez sur le bouton **+** ou **Publier**\n3. Rédigez votre message (max **300 caractères**)\n4. Optionnel : ajoutez une **photo**, une **vidéo** ou un **sondage**\n5. Cliquez sur **Publier**\n\n💡 **Astuce** : Utilisez le format **\\*\\*texte\\*\\*** pour mettre en **gras** !\n\n📊 L'indicateur circulaire montre le nombre de caractères restants.",
    keywords: ['publier', 'poster', 'creer tween', 'nouveau tween', 'ecrire tween'],
    link: '/tween',
  },

  // ═══════════════════════════════════════════════════════
  // SWIPE
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-swipe',
    category: 'Swipe',
    question: 'Comment fonctionne le système de Swipe ?',
    answer: "La page **Swipe** contient **2 onglets** :\n\n**1. 🔍 Découvrir**\n• Parcourez les profils un par un\n• **Swipez à droite** (❤️) pour liker\n• **Swipez à gauche** (✖️) pour passer\n• Si l'autre vous like aussi → **Match** 🎉\n• Vous pouvez alors démarrer une conversation privée\n\n**2. 💖 Mes Likes**\n• Retrouvez tous les profils que vous avez likés\n• Voyez le statut (en attente, matché, etc.)\n\n💡 Le swipe nécessite des **crédits** pour chaque action.",
    keywords: ['swipe', 'match', 'like', 'liker', 'rencontre', 'compatible', 'droite', 'gauche', 'decouvrir', 'mes likes'],
    link: '/swipe',
  },
  {
    id: 'static-swipe-match',
    category: 'Swipe',
    question: "Que se passe-t-il quand j'ai un match ?",
    answer: "Quand deux personnes se likent mutuellement, c'est un **Match** 🎉 :\n\n• Vous recevez une **notification** de match\n• Vous pouvez démarrer une **conversation privée** immédiatement\n• Le match apparaît dans votre liste de **Mes Likes**\n\n💡 Pour augmenter vos chances, complétez votre profil et ajoutez une belle photo !",
    keywords: ['match', 'matche', 'mutual', 'reciproque', 'aime aussi'],
    link: '/swipe',
  },

  // ═══════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-messages-page',
    category: 'Messagerie',
    question: "Comment fonctionne la page Messages ?",
    answer: "La page **Messages** contient **3 onglets** :\n\n**1. 💬 Messages** — Vos conversations privées avec d'autres membres\n• Envoyez du texte, des photos, des vidéos\n• Les **médias éphémères** disparaissent après consultation\n• Confirmations de lecture (✓✓)\n\n**2. 👥 Groupes** — Les groupes de discussion\n• **101 salons départementaux** (un par département)\n• **Groupes personnalisés** que vous pouvez créer ou rejoindre\n• Messages vocaux, photos, vidéos dans les groupes\n\n**3. 📦 Archives** — Vos conversations archivées\n• Archivez une conversation sans la supprimer\n• Retrouvez-la facilement dans cet onglet",
    keywords: ['messages', 'page messages', 'conversation', 'onglets messages', 'prive', 'groupes', 'archives'],
    link: '/messages',
  },
  {
    id: 'static-ephemeral',
    category: 'Messagerie',
    question: 'Comment fonctionnent les médias éphémères ?',
    answer: "Les **médias éphémères** sont des photos ou vidéos qui **disparaissent après consultation** :\n\n• Envoyez une photo/vidéo en mode éphémère dans un message privé\n• Le destinataire peut la visualiser **une seule fois**\n• Le média est **automatiquement supprimé** après visionnage\n• La **protection anti-capture d'écran** est activée pendant la visualisation\n• Si une capture est détectée, l'expéditeur est **alerté immédiatement**\n\n🔒 Vos contenus restent **privés et protégés**.",
    keywords: ['ephemere', 'ephemeres', 'disparait', 'temporaire', 'snap', 'photo temporaire', 'supprime apres'],
    link: '/messages',
  },
  {
    id: 'static-groups',
    category: 'Messagerie',
    question: 'Comment fonctionnent les groupes de discussion ?',
    answer: "Gay Social propose **deux types de groupes** :\n\n**1. 🏛️ Salons départementaux (101)**\n• Un salon par département français (ex: Paris 75)\n• Rejoignez votre département d'origine gratuitement\n• Adhérez à **3 départements supplémentaires** max (5 crédits par adhésion)\n• Statistiques en temps réel (membres en ligne, messages)\n\n**2. 🎨 Groupes thématiques**\n• **Créez** vos propres groupes sur des thèmes spécifiques\n• **Rejoignez** les groupes créés par d'autres membres\n• Chaque groupe a un administrateur\n• Partagez des événements dans vos groupes\n\n💡 Fonctionnalités dans les groupes :\n• Messages **vocaux** (0,3 crédit / 2 min)\n• **Photos/Vidéos** (0,2 crédit)\n• **Texte** (0,1 crédit)\n• Confirmations de lecture, messages épinglés, galerie média\n• Mettez en **sourdine** un groupe sans le quitter",
    keywords: ['groupe', 'groupes', 'salon', 'departement', 'region', 'thematique', 'rejoindre', 'creer groupe', 'communale'],
    link: '/messages',
  },
  {
    id: 'static-archives',
    category: 'Messagerie',
    question: "Comment archiver une conversation ?",
    answer: "Pour **archiver** une conversation :\n\n• Maintenez appuyé (ou glissez) sur une conversation dans l'onglet **Messages**\n• Sélectionnez **Archiver**\n• La conversation est déplacée dans l'onglet **Archives**\n\n📦 L'archivage ne supprime pas les messages — ils restent accessibles dans l'onglet Archives. Vous pouvez **désarchiver** à tout moment.",
    keywords: ['archive', 'archiver', 'archivee', 'cacher', 'masquer conversation'],
    link: '/messages',
  },

  // ═══════════════════════════════════════════════════════
  // PROFIL & ALBUMS
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-profile-page',
    category: 'Compte & Profil',
    question: "Que contient la page Profil ?",
    answer: "Votre page **Profil** comprend :\n\n• **Photo de profil** — Obligatoire pour être visible sur le site (soumise à approbation)\n• **Bio** et informations personnelles\n• **Albums photos** — Créez et gérez vos albums privés\n• **Mes Tween** — Toutes vos publications Tween\n• **ChatBot personnel** — Configurez un bot pour vos visiteurs\n• **Paramètres** — Modifiez vos préférences, notifications, sécurité\n\n📸 Toute nouvelle photo ou modification est **vérifiée** par l'équipe de modération avant publication.",
    keywords: ['profil', 'mon profil', 'page profil', 'informations', 'bio', 'modifier profil'],
    link: '/profile',
  },
  {
    id: 'static-albums',
    category: 'Compte & Profil',
    question: 'Comment fonctionnent les albums photos ?',
    answer: "Les **albums privés** vous permettent de :\n\n• **Créer** plusieurs albums thématiques depuis votre profil\n• **Télécharger** des photos et vidéos\n• **Partager** sélectivement avec certains membres\n• **Révoquer** l'accès à tout moment\n• Définir une **date d'expiration** pour le partage\n\n🔒 Seules les personnes à qui vous partagez peuvent voir vos albums.\n📬 Le destinataire reçoit une **notification** quand vous partagez.\n\n⚠️ Toutes les photos ajoutées sont **soumises à approbation** par la modération.",
    keywords: ['album', 'albums', 'photo', 'photos', 'galerie', 'partager', 'prive'],
    link: '/profile',
  },
  {
    id: 'static-profile-photo',
    category: 'Compte & Profil',
    question: "La photo de profil est-elle obligatoire ?",
    answer: "Oui ! Une **photo de profil** est **obligatoire** sur Gay Social :\n\n• Sans photo, votre profil **n'apparaît pas** sur la page d'accueil\n• Chaque photo est **soumise à approbation** par la modération\n• Les photos doivent respecter les règles de la communauté\n• Les photos à caractère illicite sont **refusées**\n\n📸 Ajoutez votre photo depuis votre page **Profil** pour être visible par la communauté !",
    keywords: ['photo profil', 'obligatoire', 'avatar', 'image profil', 'photo obligatoire', 'pas visible'],
    link: '/profile',
  },

  // ═══════════════════════════════════════════════════════
  // SÉCURITÉ — PIN / EMPREINTE
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-pin-lock',
    category: 'Sécurité',
    question: "Comment activer le code PIN ou l'empreinte digitale ?",
    answer: "Protégez l'accès à votre compte avec le **verrouillage d'application** :\n\n🔑 **Code PIN** :\n• Allez dans **Profil → Paramètres → Sécurité**\n• Activez le **verrouillage par PIN**\n• Choisissez un code à **4 ou 6 chiffres**\n• Le code sera demandé à chaque ouverture de l'app\n\n👆 **Empreinte digitale / Face ID** :\n• Si votre appareil le supporte, l'option **biométrie** est disponible\n• Activez-la dans les paramètres de sécurité\n• Utilisez votre empreinte ou reconnaissance faciale pour déverrouiller\n\n⚠️ Si vous oubliez votre PIN, vous pouvez le réinitialiser via votre email de connexion.",
    keywords: ['pin', 'code pin', 'empreinte', 'digitale', 'biometrie', 'verrouillage', 'touch id', 'face id', 'fingerprint', 'verrou', 'securiser'],
    link: '/profile',
  },

  // ═══════════════════════════════════════════════════════
  // PUBLICITÉS
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-ads',
    category: 'Publicités',
    question: "Comment fonctionnent les publicités sur Gay Social ?",
    answer: "Les **publicités** sur Gay Social :\n\n📢 **Où sont-elles affichées ?**\n• Des **bannières publicitaires** apparaissent dans le fil Tween (après la 3ème publication)\n• Elles peuvent aussi apparaître sur certaines pages\n\n🚫 **Supprimer les publicités** :\n• Souscrivez à l'option **Sans pub** depuis la page **Crédits**\n• Paiement en crédits (à partir de 7 crédits/semaine)\n• Plusieurs durées disponibles\n• Un **badge** confirme votre abonnement\n\n🏢 **Devenir annonceur** :\n• Les entreprises peuvent diffuser des annonces ciblées\n• Contactez-nous pour en savoir plus",
    keywords: ['pub', 'publicite', 'annonce', 'banniere', 'ad', 'sans pub', 'ad free', 'publicites', 'sponsorise'],
  },
  {
    id: 'static-ad-free',
    category: 'Publicités',
    question: 'Comment naviguer sans publicité ?',
    answer: "Vous pouvez supprimer les publicités en souscrivant à l'option **Sans pub** :\n\n• Accessible depuis la page **Crédits**\n• Paiement en **crédits** (à partir de 7 crédits/semaine)\n• Plusieurs durées disponibles\n• Activation **instantanée**\n\n🚫 Une fois activé, un badge confirme votre abonnement sans pub.",
    keywords: ['sans pub', 'supprimer pub', 'enlever publicite', 'desactiver pub', 'ad free'],
  },

  // ═══════════════════════════════════════════════════════
  // MODÉRATION
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-moderation',
    category: 'Modération',
    question: "Comment fonctionne la modération sur Gay Social ?",
    answer: "La **modération** sur Gay Social est assurée par une équipe dédiée :\n\n🛡️ **Système de modération** :\n• **Signalement** — Signalez tout comportement abusif depuis un profil ou un message\n• **Modérateurs humains** — Une équipe vérifie chaque signalement\n• **IA de modération** — Un système d'analyse automatique aide à détecter les contenus problématiques\n\n⚖️ **Sanctions possibles** :\n• **Avertissement** — Premier manquement mineur\n• **Suspension temporaire** — Récidive ou manquement modéré\n• **Bannissement définitif** — Manquement grave ou récidive\n\n📸 **Approbation des photos** :\n• Chaque photo ajoutée au profil est **vérifiée** par un modérateur\n• Les photos non conformes sont **refusées** avec un motif\n\n📋 Les modérateurs sont rémunérés pour leur travail de vérification.",
    keywords: ['moderation', 'moderateur', 'signaler', 'signalement', 'sanctions', 'ban', 'suspension', 'avertissement', 'regles', 'interdit'],
  },
  {
    id: 'static-report',
    category: 'Modération',
    question: "Comment signaler un profil ou un message ?",
    answer: "Pour **signaler** un comportement inapproprié :\n\n1. Rendez-vous sur le profil ou le message concerné\n2. Cliquez sur les **3 points** (⋮) ou le bouton **Signaler**\n3. Sélectionnez le **motif** du signalement\n4. Ajoutez un commentaire si nécessaire\n5. **Envoyez** le signalement\n\n📋 Un modérateur examinera votre signalement sous quelques heures.\n\n⚠️ Les faux signalements sont sanctionnés.",
    keywords: ['signaler', 'report', 'reporter', 'abusif', 'harcelement', 'insulte', 'spam', 'fake', 'faux profil'],
  },

  // ═══════════════════════════════════════════════════════
  // DONNÉES & EXPORT
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-data-export',
    category: 'Compte & Profil',
    question: "Comment télécharger mes données personnelles ?",
    answer: "Conformément au **RGPD**, vous pouvez exporter toutes vos données :\n\n1. Allez dans **Profil → Paramètres**\n2. Section **Données personnelles**\n3. Cliquez sur **Exporter mes données**\n4. Entrez votre **mot de passe** pour confirmer\n5. L'export génère une **archive ZIP** contenant :\n   • Vos données de profil (JSON)\n   • Toutes vos photos et médias\n   • Votre historique de conversations\n   • Vos crédits et transactions\n\n📥 La progression est affichée en temps réel. L'archive est **protégée par mot de passe**.\n\n⏱️ Le traitement peut prendre quelques minutes selon le volume de données.",
    keywords: ['telecharger', 'donnees', 'export', 'exporter', 'rgpd', 'sauvegarde', 'archive', 'zip', 'gdpr'],
    link: '/profile',
  },

  // ═══════════════════════════════════════════════════════
  // CRÉDITS & PAIEMENTS
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-credits-system',
    category: 'Crédits & Paiements',
    question: 'Comment fonctionne le système de crédits ?',
    answer: "Le système de crédits Gay Social comprend **4 types** :\n\n1. **Crédits quotidiens** : 5 crédits rechargés automatiquement chaque jour\n2. **Crédits passifs** : accumulation automatique à intervalle régulier\n3. **Crédits bonus** : obtenus via parrainage, vérification d'identité, codes promo\n4. **Crédits achetés** : via PayPal ou carte bancaire\n\nLes crédits sont utilisés pour : envoyer des messages privés, booster votre profil, utiliser le swipe, activer votre ChatBot, etc.\n\n💡 **Astuce** : Vous pouvez **verrouiller** certains types de crédits pour les protéger !\n\n🔥 **Promotions** : Quand la recharge passive est boostée, un bandeau spécial apparaît sur la page Crédits.",
    keywords: ['credit', 'credits', 'systeme', 'fonctionnement', 'types', 'quotidien', 'passif', 'bonus', 'achete'],
  },
  {
    id: 'static-free-credits',
    category: 'Crédits & Paiements',
    question: 'Comment obtenir des crédits gratuits ?',
    answer: "Plusieurs façons d'obtenir des crédits **gratuitement** :\n\n• **Crédits quotidiens** : 5 crédits par jour (automatique)\n• **Crédits passifs** : accumulation automatique\n• **Vérification d'identité** : bonus de crédits à la validation\n• **Parrainage** : crédits offerts pour vous et votre filleul\n• **Codes promo** : disponibles lors d'événements spéciaux\n\n💰 Vous n'avez **jamais besoin de payer** pour utiliser les fonctions de base !",
    keywords: ['gratuit', 'free', 'obtenir', 'gagner', 'comment avoir', 'sans payer'],
  },
  {
    id: 'static-dynamic-pricing',
    category: 'Crédits & Paiements',
    question: 'Les tarifs des actions peuvent-ils changer ?',
    answer: "Oui ! Tous les coûts d'actions sur Gay Social sont **dynamiques** :\n\n• Les administrateurs peuvent ajuster les tarifs **en temps réel**\n• Vous êtes **notifié automatiquement** de tout changement de prix\n• Quand un tarif est **réduit**, un **badge promo** s'affiche\n• Quand une action devient **gratuite**, elle est signalée par un badge 🎁\n• Les prix barrés montrent l'ancien tarif vs le nouveau",
    keywords: ['tarif', 'prix', 'dynamique', 'promo', 'promotion', 'reduction', 'change', 'augmente', 'baisse'],
  },
  {
    id: 'static-passive-promo',
    category: 'Crédits & Paiements',
    question: 'Comment savoir si la recharge passive est en promotion ?',
    answer: "Quand la recharge passive est boostée, **deux indicateurs visuels** apparaissent :\n\n1. 🔥 **Bandeau promo** en haut de la page Crédits\n2. **Badge « Promo »** sur la carte Passif\n\nProfitez des promotions pour accumuler des crédits plus rapidement !",
    keywords: ['promo', 'promotion', 'passif', 'recharge', 'boost', 'boostee', 'accelere', 'intervalle', 'reduit'],
  },

  // ═══════════════════════════════════════════════════════
  // VÉRIFICATION
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-verification',
    category: 'Vérification',
    question: "Comment vérifier mon identité ?",
    answer: "La vérification d'identité se fait en **3 étapes** :\n\n1. **Photo du recto** de votre pièce d'identité (CNI, passeport, permis)\n2. **Photo du verso** (si applicable)\n3. **Selfie** pour confirmer votre identité\n\n📋 **Processus** :\n• Soumettez vos documents depuis votre profil\n• Un modérateur vérifie sous **quelques heures**\n• Vous recevez une **notification** du résultat\n• En cas d'approbation : badge vérifié ✅ + crédits bonus 🎁\n\n🔐 Vos documents sont **supprimés** après vérification.",
    keywords: ['verification', 'verifier', 'identite', 'cni', 'passeport', 'selfie', 'badge', 'document'],
    link: '/profile',
  },

  // ═══════════════════════════════════════════════════════
  // SÉCURITÉ
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-screenshot-protection',
    category: 'Sécurité',
    question: "Comment fonctionne la protection anti-capture ?",
    answer: "Gay Social intègre une **protection anti-capture d'écran** :\n\n• Les médias éphémères sont **protégés** contre les captures\n• Si une capture est détectée, l'expéditeur est **alerté**\n• Les récidivistes peuvent recevoir des **sanctions**\n• Un filigrane invisible est ajouté sur certains contenus\n\n⚠️ Les captures d'écran de contenu protégé peuvent entraîner la **suspension** de votre compte.",
    keywords: ['capture', 'screenshot', 'protection', 'anti', 'ecran', 'filigrane', 'watermark', 'detecte'],
  },
  {
    id: 'static-privacy',
    category: 'Sécurité',
    question: 'Comment protéger ma vie privée ?',
    answer: "Gay Social offre de nombreuses options de **confidentialité** :\n\n• **Code PIN / Empreinte digitale** : protégez l'accès à l'app\n• **Blocage** : bloquez tout utilisateur indésirable\n• **Signalement** : signalez les comportements abusifs\n• **Médias éphémères** : envoyez du contenu auto-destructible\n• **Protection anti-capture** : détection des screenshots\n• **Suppression de compte** : avec effacement complet des données\n• **Export RGPD** : téléchargez toutes vos données\n\n⚠️ Ne partagez jamais vos informations personnelles.",
    keywords: ['confidentialite', 'prive', 'donnees', 'rgpd', 'vie privee', 'protection'],
    link: '/profile',
  },
  {
    id: 'static-avatar-security',
    category: 'Sécurité',
    question: 'Mes photos de profil sont-elles protégées ?',
    answer: "Oui ! Les avatars et photos de profil sont stockés de manière **privée** :\n\n• Le stockage des avatars est **non public**\n• Seuls les **utilisateurs connectés** peuvent voir les photos\n• Les images sont servies via des **URLs signées temporaires** (expiration 1h)\n• Un **cache intelligent** évite les rechargements inutiles\n\n🔒 Vos photos ne sont **jamais** accessibles aux visiteurs non inscrits.",
    keywords: ['avatar', 'photo profil', 'image', 'protege', 'prive', 'securise', 'visible', 'public'],
  },
  {
    id: 'static-credit-security',
    category: 'Sécurité',
    question: 'Mes crédits sont-ils protégés contre la fraude ?',
    answer: "Gay Social applique des mesures de sécurité strictes :\n\n• **Aucune modification directe** du solde depuis le navigateur\n• Toutes les opérations passent par des **fonctions sécurisées côté serveur**\n• Le verrouillage de crédits utilise une **validation serveur**\n• Chaque transaction est **tracée et auditée**\n\n🛡️ Votre solde est protégé par des contrôles automatiques.",
    keywords: ['fraude', 'securite', 'credit', 'protege', 'manipulation', 'hack', 'triche', 'vol'],
  },

  // ═══════════════════════════════════════════════════════
  // AUTRES
  // ═══════════════════════════════════════════════════════
  {
    id: 'static-rules',
    category: 'Modération',
    question: 'Quelles sont les règles de la communauté ?',
    answer: "Les **règles principales** de Gay Social :\n\n✅ **Respectez** tous les membres\n✅ **Vérifiez** votre identité\n✅ Utilisez un **langage correct**\n\n❌ Pas de **spam** ni publicité\n❌ Pas de contenu **illégal**\n❌ Pas de **faux profils**\n❌ Pas de **harcèlement**\n\n⚠️ Le non-respect entraîne un **avertissement**, une **suspension** ou un **bannissement**.\n\n📖 Consultez les règles complètes dans la section **Règles**.",
    keywords: ['regles', 'reglement', 'interdit', 'autorise', 'sanction', 'ban', 'suspension', 'avertissement'],
    link: '/regles',
  },
  {
    id: 'static-delete-account',
    category: 'Compte & Profil',
    question: 'Comment supprimer mon compte ?',
    answer: "Pour **supprimer votre compte** :\n\n1. Allez dans **Paramètres** de votre profil\n2. Cliquez sur **Supprimer mon compte**\n3. Confirmez votre choix\n4. Un délai de **7 jours** est appliqué avant suppression définitive\n\n⚠️ Toutes vos données seront **définitivement supprimées**. Si vous vous reconnectez pendant le délai de 7 jours, la suppression est **annulée**.",
    keywords: ['supprimer', 'effacer', 'compte', 'desinscrire', 'fermer', 'annuler compte', 'quitter'],
    link: '/profile',
  },
  {
    id: 'static-chatbot-personal',
    category: 'Fonctionnalités',
    question: 'Comment configurer mon ChatBot personnel ?',
    answer: "Le **ChatBot personnel** permet aux visiteurs de votre profil de discuter avec un bot que vous configurez :\n\n1. Allez dans les **Paramètres** de votre profil\n2. Section **ChatBot**\n3. **Activez** le ChatBot (coûte des crédits)\n4. Personnalisez le **message d'accueil**\n5. Ajoutez des **informations** que le bot peut partager\n\n💬 Les visiteurs peuvent interagir gratuitement avec votre bot !",
    keywords: ['chatbot', 'bot', 'automatique', 'configurer', 'personnel', 'robot'],
    link: '/profile',
  },
  {
    id: 'static-premium',
    category: 'Fonctionnalités',
    question: "Quels sont les avantages Premium ?",
    answer: "L'abonnement **Premium** offre :\n\n• **Swipes illimités**\n• **Aucune publicité**\n• **Badge Premium** visible sur votre profil\n• **Boost de profil** offert\n• **Accès prioritaire** aux nouvelles fonctionnalités\n\n👑 Contactez un agent pour activer votre Premium !",
    keywords: ['premium', 'vip', 'abonnement', 'avantage', 'offre', 'souscrire'],
  },
  {
    id: 'static-help-center',
    category: 'Général',
    question: "Où trouver plus d'informations d'aide ?",
    answer: "Consultez notre **Centre d'aide** pour des articles détaillés sur chaque sujet :\n\n📚 **Centre d'aide** — Articles classés par catégorie\n🤖 **Chatbot** — Posez vos questions ici\n👤 **Agent** — Tapez « agent » pour contacter un conseiller\n\n📖 Rendez-vous sur le **Centre d'aide** pour parcourir tous les articles !",
    keywords: ['aide', 'help', 'faq', 'centre aide', 'information', 'documentation'],
    link: '/aide',
  },
];

// ─── Normalisation ───────────────────────────────────────────────────
export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// ─── Expand query with synonyms ──────────────────────────────────────
const expandWithSynonyms = (words: string[]): string[] => {
  const expanded = new Set(words);
  for (const word of words) {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(s => expanded.add(s));
    }
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    }
  }
  return Array.from(expanded);
};

// ─── Scoring ─────────────────────────────────────────────────────────
export interface ScoredResult {
  id: string;
  category: string;
  question: string;
  answer: string;
  score: number;
  isStatic: boolean;
  link?: string;
}

interface FAQArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const searchKnowledgeBase = (
  query: string,
  faqArticles: FAQArticle[]
): ScoredResult[] => {
  const normalizedQuery = normalize(query);
  const baseWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
  if (baseWords.length === 0) return [];

  const expandedWords = expandWithSynonyms(baseWords);

  const scoreEntry = (
    entry: { id: string; category: string; question: string; answer: string; keywords?: string[]; link?: string },
    isStatic: boolean
  ): ScoredResult | null => {
    const nq = normalize(entry.question);
    const na = normalize(entry.answer);
    const nc = normalize(entry.category);
    const nk = entry.keywords ? entry.keywords.map(normalize).join(' ') : '';

    let score = 0;

    if (nq.includes(normalizedQuery)) score += 15;

    for (const word of expandedWords) {
      if (nq.includes(word)) score += 4;
      if (nc.includes(word)) score += 2;
      if (na.includes(word)) score += 1;
      if (nk.includes(word)) score += 5;
    }

    const baseMatches = baseWords.filter(w => nq.includes(w) || nk.includes(w)).length;
    if (baseMatches >= 2) score += baseMatches * 3;

    if (score === 0) return null;
    return {
      id: entry.id,
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      score,
      isStatic,
      link: entry.link,
    };
  };

  const results: ScoredResult[] = [];

  for (const entry of STATIC_KNOWLEDGE) {
    const r = scoreEntry(entry, true);
    if (r) results.push(r);
  }

  for (const article of faqArticles) {
    const r = scoreEntry(article, false);
    if (r) results.push(r);
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

// ─── Post-answer options builder ─────────────────────────────────────
export const buildPostAnswerOptions = (
  articleId: string,
  category: string,
  allArticles: FAQArticle[],
  staticKnowledge: StaticKnowledge[]
) => {
  const relatedFaq = allArticles
    .filter(a => a.category === category && a.id !== articleId)
    .slice(0, 2);
  const relatedStatic = staticKnowledge
    .filter(s => s.category === category && s.id !== articleId)
    .slice(0, 2 - relatedFaq.length);

  const options: { label: string; value: string }[] = [];

  for (const r of [...relatedFaq, ...relatedStatic]) {
    options.push({ label: `📄 ${r.question}`, value: `faq:${r.id}` });
  }

  options.push({ label: '🔍 Problème non résolu', value: 'not_resolved' });
  options.push({ label: '📋 Choisir un autre sujet', value: 'change_category' });
  options.push({ label: '👤 Contacter un agent', value: 'contact_agent' });

  return options;
};

// ─── Disambiguation message builder ──────────────────────────────────
export const buildDisambiguationMessage = (results: ScoredResult[]) => {
  if (results.length <= 1) return null;
  if (results[0].score > results[1].score * 2) return null;

  return {
    text: `Votre demande pourrait concerner **${results.length} sujets**. Lequel correspond le mieux ? 👇`,
    options: results.slice(0, 4).map(r => ({
      label: r.question,
      value: `faq:${r.id}`,
    })),
  };
};
