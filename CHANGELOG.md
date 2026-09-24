## v0.12.0 — Deeper proof families

- Add three new server-verifiable quest families: CI/CD, documentation and security.
- Expand the Evidence Engine with GitHub Actions build gates, documentation coverage, SECURITY policy, dependency automation and code scanning signals.
- Expand the skill constellation with CI/CD, Documentation and Security nodes.
- Add canonical server XP rewards for the new quest kinds.
- Deploy verify-quest Edge Function v4 with relevant-file checks for all seven quest families.
- Add public proof detail pages exposing the exact commit, relevant files, baseline and newly unlocked objectives.
- Add proof-backed public achievements derived from verified quests, repositories, skills and XP.
- Keep FR / EN / DE / ES coverage for the new quest and evidence surfaces.

## v0.11.0 — Proof portfolio and quest deck

- Public profiles now expose a visual multi-repository proof portfolio.
- Verified quests link to the exact GitHub commit used as proof.
- Public skill progression aggregates the latest repository scans.
- A repository can keep several quest kinds active at the same time.
- The analyzer now exposes a quest deck instead of only one mission.
- The quest engine and GitHub API transport were extracted from the monolithic analyzer following Graphify findings.
- Supabase RLS exposes limited scan snapshots only when the profile is explicitly public.
- Graphify continues to validate the code architecture in CI.

## v0.10.0 — Contribution-bound progression

- Store the durable GitHub numeric user ID on ProofQuest profiles.
- Start quests server-side with a canonical baseline and server timestamp.
- Require a post-start GitHub commit from the authenticated GitHub identity before XP can be awarded.
- Require the proof commit to touch files relevant to the quest.
- Require at least one objective to become newly complete after quest start.
- Support transferred repositories, collaborators and organization repositories without relying on owner=username.
- Expand repository discovery to public member repositories.
- Add Graphify tooling and a CI artifact for codebase maps.

## v0.9.0 — Verified progression

- Owned repository scans are stored in Supabase.
- Quests can be started from the repository dashboard.
- Quest completion is verified server-side against the live public GitHub repository.
- Canonical XP rewards are granted atomically in Postgres and cannot be doubled.
- The progression page now aggregates the latest scans into a multi-repository skill matrix.
- A deployed Supabase Edge Function handles GitHub verification.
- Profiles remain private by default and raw scan snapshots remain private.

## v0.8.0 — Cloud onboarding

- GitHub OAuth via Supabase SSR.
- Public repository picker after sign-in.
- Persistent cloud identity and opt-in public profile.
- Progress page backed by Supabase RLS.
- Reproducible cloud migration in the repository.
- GitHub Actions CI for typecheck and production build.
- No database password or server secret committed.

# Changelog

## 0.4.0 — 2026-09-23

- Evidence Engine profond pour TypeScript, testing, GitHub Actions, Docker et Kubernetes ;
- lecture ciblée de `tsconfig`, scripts `package.json`, workflows, Dockerfile, README et manifests ;
- distinction entre simple présence d'un workflow et exécution réelle des tests/typecheck ;
- détection de `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` et `exactOptionalPropertyTypes` ;
- détection Docker multi-stage, non-root, `HEALTHCHECK`, `.dockerignore`, Compose, documentation et build CI ;
- objectifs de quête désormais évalués par les preuves ;
- réanalyse fraîche avec contournement du cache applicatif ;
- comparaison du scan précédent via `localStorage` ;
- détection locale d'une quête devenue validable ;
- traductions FR/EN/DE/ES étendues aux nouvelles preuves ;
- endpoint health mis à jour vers `evidence-engine-v0.4` ;
- version applicative portée à 0.4.0.

## 0.3.0 — 2026-09-23

- internationalisation sans dépendance externe : français, anglais, allemand, espagnol ;
- français par défaut et préférence persistante via cookie ;
- sélecteur de langue disponible sur les écrans principaux ;
- messages de scan, dashboard, preuves et quêtes localisés ;
- nœuds de compétences désormais interactifs ;
- panneau de détail avec score de preuves, force, preuves sources et prochain palier ;
- liens vers les fichiers GitHub qui justifient une preuve ;
- séparation explicite entre « preuve du repository » et « niveau réel du développeur » ;
- version applicative portée à 0.3.0.

## 0.2.0 — 2026-09-22

### Ajouté

- formulaire d'analyse d'un repository GitHub public ;
- client REST GitHub côté serveur avec token facultatif ;
- récupération du repository, des langages, de l'arbre Git et de fichiers de configuration ciblés ;
- Evidence Engine déterministe v0.2 ;
- Skill Graph alimenté par de vraies preuves ;
- quête proposée à partir des lacunes détectées ;
- expérience de scan animée ;
- dashboard de repository réel ;
- gestion claire des erreurs GitHub et de la limite d'API.

### Corrigé

- warning d'hydratation provoqué par un attribut injecté par une extension navigateur sur `<html>` : ajout ciblé de `suppressHydrationWarning` au root layout.

### Limites connues

- analyse centrée sur l'écosystème JavaScript/TypeScript ;
- heuristiques encore simples ;
- repositories privés non pris en charge ;
- aucune IA générative dans le score ou les preuves ;
- pas encore de persistance en base de données.
