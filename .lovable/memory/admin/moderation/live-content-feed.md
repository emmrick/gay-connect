---
name: Live moderation feed
description: Sous-onglet Modération > Direct affichant en temps réel les nouveaux contenus (messages privés, messages de groupe, tweens, snaps éphémères) avec filtres, pause, débit/min et suppression.
type: feature
---
- Route : `/admin/direct` (section `live-content`, groupe `moderation`).
- Permission : admin OU `can_manage_content`.
- Sources Realtime (Postgres INSERT) :
  - `messages` (privés et groupes) — REPLICA IDENTITY FULL
  - `tweens` — REPLICA IDENTITY FULL
  - `ephemeral_media` — ajouté à `supabase_realtime` + REPLICA IDENTITY FULL
- Composant : `src/components/admin/LiveContentFeed.tsx` (max 200 items en mémoire).
- Suppression : `messages` → soft (`deleted_at` + `deleted_by`), `tweens`/`ephemeral_media` → hard delete.
- Compteur "X/min" basé sur fenêtre glissante 60s.
