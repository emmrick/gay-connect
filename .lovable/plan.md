

## Plan : Toggle admin pour la restriction géographique

### Objectif
Ajouter une option dans le panneau "Fonctionnalités" de l'admin pour activer/désactiver la restriction géographique (geo-blocking). Quand désactivé, le site sera accessible depuis tous les pays.

### Modifications

**1. Base de données — Insérer le toggle `geo_restriction`**
- Ajouter une ligne dans `feature_toggles` avec :
  - `feature_key`: `geo_restriction`
  - `label`: `Restriction géographique`
  - `description`: `Limite l'accès au site à la France et DOM-TOM uniquement`
  - `category`: `general`
  - `icon`: `🌍`
  - `is_enabled`: `true` (activé par défaut)

**2. `src/components/GeoBlockGuard.tsx`**
- Importer `useIsFeatureEnabled` depuis `useFeatureToggles`
- Si le toggle `geo_restriction` est désactivé → bypass complet (afficher les children directement sans vérifier l'IP)
- Si activé → comportement actuel inchangé (vérification IP + blocage hors France)

### Résultat
L'admin peut basculer le switch "Restriction géographique" dans Configuration > Fonctionnalités pour ouvrir ou fermer le site aux visiteurs étrangers, en temps réel via Realtime.

