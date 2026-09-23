# Modèle de données préliminaire

## User

- `id`
- `github_user_id`
- `username`
- `avatar_url`
- `created_at`

## Repository

- `id`
- `owner_user_id`
- `github_repo_id`
- `name`
- `full_name`
- `visibility`
- `default_branch`
- `last_synced_at`

## Analysis

- `id`
- `repository_id`
- `engine_version`
- `status`
- `started_at`
- `completed_at`
- `snapshot_hash`

## Evidence

- `id`
- `analysis_id`
- `skill_key`
- `evidence_type`
- `label`
- `source_path`
- `confidence`
- `metadata_json`

## SkillAssessment

- `analysis_id`
- `skill_key`
- `progress_points`
- `evidence_count`
- `summary`

`progress_points` est une métrique interne de gamification, pas une mesure universelle de compétence.

## Quest

- `id`
- `analysis_id`
- `title`
- `description`
- `target_skill_key`
- `criteria_json`
- `xp_reward`
- `status`

## PublicProfile

- `user_id`
- `slug`
- `is_public`
- `headline`
- `updated_at`

## RLS

Lorsque Supabase sera ajouté : activer Row Level Security sur toutes les tables utilisateur et tester les politiques avant exposition au client.
