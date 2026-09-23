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
app/src/graphify-out/
├── graph.json
├── GRAPH_REPORT.md
└── ...
```

Ces sorties sont volontairement ignorées par Git.

## CI

Le workflow `.github/workflows/graphify.yml` génère un artefact `proofquest-graphify` lors des changements importants du code. Il contient notamment `graph.json` et `GRAPH_REPORT.md`, téléchargeables depuis l'exécution GitHub Actions correspondante.

## Installation du skill officiel

Pour installer le skill Graphify adapté à un environnement de développement local :

```powershell
uvx --from graphifyy graphify install --project --platform codex
```

Cette commande génère la version du skill correspondant à la version de Graphify installée, au lieu de conserver dans ProofQuest une copie tierce susceptible de devenir obsolète.
