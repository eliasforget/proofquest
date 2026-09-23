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
