# Échange de photos vérifié

Nouvelle fonctionnalité accessible depuis une conversation privée : deux membres peuvent s'échanger une (ou plusieurs) photo, mais aucun ne voit la photo de l'autre tant que **les deux** ont envoyé ET qu'un modérateur/admin a validé chaque photo via une mission.

## Parcours utilisateur

1. Dans le chat privé, bouton **« Échange de photos »** dans le menu + (à côté des cadeaux, sondages…).
2. L'initiateur envoie une demande → bloc interactif dans le chat « A propose un échange de photos · Accepter / Refuser ».
3. Le destinataire **accepte** → l'échange passe en statut `accepted`. Les deux côtés voient un bloc « Uploadez votre photo ».
4. Chacun upload sa photo (bucket privé `photo-exchanges`, watermarkée, jamais visible à l'autre tant que non validée).
5. **Dès que les 2 photos sont uploadées**, une **mission de modération** `photo_exchange_review` est créée automatiquement (réutilise le système de missions existant, rémunération 0,30 € — à confirmer).
6. Un modérateur ouvre la mission, voit les 2 photos côte à côte, valide ou rejette **chaque photo individuellement** (conformité, pas de contenu interdit, correspond à ce qui était prévu).
7. Si **les 2 photos sont validées** → l'échange passe en `completed`, le bloc dans le chat devient cliquable des deux côtés pour révéler la photo reçue (l'utilisateur ne voit toujours pas sa propre photo côté chat puisqu'il l'a uploadée).
8. Si une photo est **rejetée** → l'utilisateur concerné reçoit une notif « Votre photo n'est pas conforme, raison : … » et peut re-uploader (1 retry). L'autre attend.
9. Tant qu'un côté n'a pas validé/uploadé, **aucune photo n'est révélée** (flou total, vraiment invisible côté front et côté URLs signées).

## Schéma backend

### Table `photo_exchanges`
- `id` uuid pk
- `conversation_id` uuid (référence conversation privée)
- `initiator_id`, `recipient_id` uuid
- `status` enum : `pending` (en attente d'accept) | `accepted` (uploads en cours) | `awaiting_review` (2 photos là, mission créée) | `completed` (les 2 validées, révélées) | `rejected` | `cancelled`
- `created_at`, `updated_at`

### Table `photo_exchange_photos`
- `id` uuid pk
- `exchange_id` uuid (référence `photo_exchanges`)
- `user_id` uuid (qui a uploadé)
- `storage_path` text (bucket privé `photo-exchanges`, jamais d'URL publique)
- `review_status` enum : `pending` | `approved` | `rejected`
- `review_reason` text (si rejet)
- `reviewed_by` uuid, `reviewed_at` timestamptz
- `retry_count` int default 0 (max 1)

### RLS
- Lecture d'un `photo_exchanges` : initiator OU recipient OU staff.
- Lecture d'une `photo_exchange_photos` :
  - Le propriétaire (`user_id = auth.uid()`) peut toujours lire sa propre row (mais l'image n'est servie qu'après upload).
  - L'**autre participant** peut lire la row **seulement si** `review_status = 'approved'` ET que **toutes** les photos de l'échange sont `approved` (status `completed`).
  - Staff (admin/modérateur avec `can_manage_content`) : lecture complète.
- Insert : seulement par le participant concerné.

### Bucket Storage
- Nouveau bucket privé `photo-exchanges`, signed URLs 1h (règle mémoire respectée).
- Policy : seul le owner, l'autre participant **si exchange completed**, et le staff peuvent générer une signed URL via Edge Function.

### Trigger
- Après insert/update sur `photo_exchange_photos` : si l'échange a 2 photos uploadées → passer le statut à `awaiting_review` et créer une **mission** dans `pending_tasks` (type `photo_exchange_review`).
- Quand les 2 `review_status = 'approved'` → passer l'échange à `completed` et notifier les 2 participants.

## Frontend

### Chat privé
- Nouveau bouton « Échange de photos » dans le menu d'actions du composer (icône `ImagePlus`).
- Nouveau bloc interactif `PhotoExchangeBlock` (similaire aux polls / credit gifts) avec 4 états visuels : pending / accepted-uploading / awaiting-review / completed (révélation tap).
- Composant `PhotoExchangeUploadSheet` (bottom sheet) pour uploader sa photo.

### Mission de modération
- Nouvelle carte mission dans `pending-tasks` admin : photos côte à côte, boutons Approuver / Rejeter (avec raison) pour chaque photo.
- Rémunération à ajouter dans `credit_costs` / config mission rewards.

### Notifications
- Notif push : « X vous propose un échange de photos »
- Notif : « Votre photo a été validée » / « Photo non conforme : … »
- Notif : « Échange complété ! Découvrez la photo »

## Coût en crédits
- Proposition : **gratuit** pour la demande, mais **5 crédits** prélevés à l'initiateur quand l'échange est `completed` (pour couvrir le coût de modération). À valider avec toi.

## Fichiers principaux à créer
- Migration SQL (tables, enums, RLS, trigger, bucket)
- `src/hooks/usePhotoExchange.ts`
- `src/components/messaging/PhotoExchangeBlock.tsx`
- `src/components/messaging/PhotoExchangeUploadSheet.tsx`
- `src/components/admin/PhotoExchangeReviewPanel.tsx` (dans le détail d'une mission)
- Edge function `photo-exchange-signed-url` pour servir les URLs signées avec vérification d'accès stricte
- Intégration dans `PrivateChatComposer`, `MessagesList`, mission system

## Questions avant de coder

1. **Coût en crédits** : gratuit, ou X crédits prélevés (à qui et quand) ?
2. **Nombre de photos** : 1 seule de chaque côté, ou jusqu'à N (3 ?) avec un compteur ?
3. **Mission rémunération** : combien pour le modérateur (proposition 0,30 €) ?
4. **Retry après rejet** : 1 tentative supplémentaire OK, ou plus ?
