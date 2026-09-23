# Moteur d'analyse — Evidence Engine v0.4

## Principe

ProofQuest ne demande jamais à un modèle génératif de décider arbitrairement d'un niveau. Le moteur produit d'abord des **preuves déterministes et inspectables**.

## Pipeline actuel

```text
GitHub repository
   ↓
metadata + languages + recursive tree
   ↓
fichiers ciblés uniquement
   ├── package.json
   ├── tsconfig*.json
   ├── workflows GitHub Actions
   ├── Dockerfile
   ├── README
   └── manifests Kubernetes ciblés
   ↓
normalisation des signaux
   ↓
Evidence[]
   ↓
score de preuves par compétence
   ↓
objectifs de quête
```

## TypeScript

Signaux actuellement pris en charge :

- présence d'un tsconfig ;
- dépendance TypeScript ;
- fichiers `.ts/.tsx/.mts/.cts` ;
- ratio TS/JS ;
- `strict` ;
- `noImplicitAny` ;
- `strictNullChecks` ;
- `noUncheckedIndexedAccess` ;
- `exactOptionalPropertyTypes` ;
- script typecheck ;
- typecheck exécuté dans GitHub Actions.

Limite : `extends` n'est pas encore résolu récursivement.

## Testing

Séparer explicitement :

1. fichiers de test ;
2. framework de test déclaré ;
3. script de test reproductible ;
4. workflow présent ;
5. commande de tests réellement trouvée dans le workflow.

La simple présence d'un fichier `.github/workflows/*.yml` n'est plus suffisante pour considérer « tests exécutés en CI ».

## Docker

Signaux :

- Dockerfile ;
- Compose ;
- multi-stage ;
- utilisateur non-root ;
- HEALTHCHECK ;
- `.dockerignore` ;
- commande Docker documentée dans le README ;
- build Docker dans GitHub Actions.

## Kubernetes

Signaux ciblés :

- manifests détectés ;
- `kind: Deployment` ;
- `kind: Service` ;
- probes ;
- bloc `resources`.

## Règle de confiance

Le score est un **score de preuves du dépôt**. Il ne doit jamais être présenté comme une mesure objective de séniorité, intelligence, employabilité ou qualité globale du développeur.
