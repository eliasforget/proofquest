# Graphify dans ProofQuest

ProofQuest utilise **Graphify-Labs/graphify** comme outil de cartographie du code pour faciliter les revues d'architecture et les modifications futures.

Le package officiel est `graphifyy` et la commande reste `graphify`.

## Local — Windows

Depuis la racine du dépôt :

```powershell
winget install astral-sh.uv
.\scripts\GRAPHIFY_CODE.ps1
```

Par défaut, le script analyse `app/src` afin de rester sur un corpus code-only et d'éviter toute extraction sémantique inutile.

Sorties :

```text
graphify-out/
├── graph.json
├── GRAPH_REPORT.md
└── ...
```

Le dossier `graphify-out/` est volontairement ignoré par Git.

## CI

Le workflow `.github/workflows/graphify.yml` génère également un artefact `proofquest-graphify` lors des changements importants du code. Il peut être téléchargé depuis l'exécution GitHub Actions correspondante.

## Pourquoi ne pas versionner le skill Graphify complet ?

Le skill officiel peut être installé localement avec :

```powershell
uvx --from graphifyy graphify install --project --platform codex
```

Cette installation génère les fichiers adaptés à la version installée de Graphify. Garder ici seulement le script et le workflow évite de dupliquer une grosse copie tierce qui peut rapidement devenir obsolète.
