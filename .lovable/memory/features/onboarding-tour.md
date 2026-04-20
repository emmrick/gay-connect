---
name: Onboarding Tour interactif
description: Tour plein écran 10 étapes auto-déclenché à la 1ère connexion, relancable via Paramètres et Chatbot d'aide
type: feature
---

Tour d'onboarding plein écran (`OnboardingTour.tsx`) en 10 étapes (Bienvenue, Accueil, Swipe, Profil, Messagerie, Albums, Crédits, Parrainage, Sécurité, Récap). Auto-ouverture 1× après inscription via flag `localStorage[gc_onboarding_completed_v2_{userId}]` (migre depuis v1).

**Hook central** : `useOnboarding()` expose `open/close/complete/reset/goToStep`. Helper `openOnboardingTour()` dispatche un event `gc:open-onboarding` pour relance externe.

**3 points de relance** :
- Paramètres → Aide & Support → bouton CTA "📖 Revoir le guide d'utilisation" (en tête de section)
- Chatbot d'aide → nœud racine `__open_onboarding_tour` ("🎓 Revoir le guide complet") avec chip "Lancer le guide interactif"
- Programmatique : `openOnboardingTour()` depuis n'importe où

**Étapes** : data-driven dans `src/lib/onboarding/onboardingSteps.ts` (icône Lucide, emoji, titre, sous-titre personnalisé pseudo, bullets, tip 💡, CTA contextuel optionnel vers route).

**UX** : barre de progression segmentée cliquable + compteur N/10, swipe horizontal (framer-motion drag), touches ←/→/Esc, bouton "Passer" avec confirmation, halo gradient par accent (9 palettes). CTA contextuel marque comme terminé puis navigate.

L'ancien `OnboardingGuideDialog` (modale 5 étapes) a été supprimé. La page `/guide` reste pour la version longue en accordéon.
