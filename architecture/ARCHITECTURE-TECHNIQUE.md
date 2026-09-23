# Architecture technique

## Cible MVP

```text
Browser
  │
  ▼
Next.js 16.3.x (App Router)
  ├── UI / Server Components
  ├── Route handlers / server actions
  ├── GitHub adapter
  ├── Evidence engine
  └── AI adapter (plus tard)
           │
     ┌─────┴─────┐
     ▼           ▼
  GitHub      Supabase
 API/App     Postgres/Auth
                   │
                   ▼
               OpenAI API
              (phase 2)
```

## Principe

Le coeur métier ne doit dépendre ni de GitHub ni d'OpenAI. Il reçoit un `RepositorySnapshot` normalisé et produit `Evidence[]`, `SkillAssessment[]` et `QuestDraft[]`.

Cela permettra de tester le moteur localement sans réseau.

## Modules

- `adapters/github` : collecte externe ;
- `domain/evidence` : types et règles ;
- `domain/skills` : graphe de compétences ;
- `domain/quests` : génération/validation ;
- `adapters/ai` : synthèse structurée ;
- `persistence` : données utilisateur et analyses.

## Choix de départ

Le squelette livré reste volontairement plus simple que cette cible. Ne pas créer dix couches avant d'en avoir besoin.
