# ProofQuest web — v0.4

Application Next.js / TypeScript du MVP ProofQuest.

## Nouveautés v0.4

- analyse profonde de `tsconfig.json` : `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ;
- lecture des scripts `package.json` pour détecter test et typecheck ;
- inspection ciblée des workflows GitHub Actions pour vérifier si tests/typecheck/Docker sont réellement exécutés ;
- analyse Dockerfile : multi-stage, utilisateur non-root, `HEALTHCHECK`, `.dockerignore`, Compose, documentation README et build CI ;
- analyse Kubernetes ciblée : Deployment, Service, probes et ressources ;
- objectifs de quête réellement cochés à partir des preuves ;
- bouton **Réanalyser maintenant** qui contourne le cache de 5 minutes ;
- comparaison locale entre deux scans du même dépôt ;
- détection d'une quête devenue validable entre deux scans ;
- français, anglais, allemand et espagnol.

## Lancer

```powershell
cd C:\Users\elias\Desktop\ProofQuest\app
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Token GitHub facultatif

Créer `.env.local` :

```env
GITHUB_TOKEN=github_pat_xxx
```

Le token n'est pas nécessaire pour tester des dépôts publics tant que les limites GitHub ne sont pas atteintes. Ne jamais committer ce fichier.

## Limites v0.4

- dépôts publics uniquement ;
- analyse principalement optimisée pour les projets web JavaScript/TypeScript ;
- les regex de workflows/configurations sont des heuristiques déterministes, pas un parseur complet de YAML/JSONC ;
- `extends` dans `tsconfig` n'est pas encore résolu récursivement ;
- historique de scan uniquement dans le navigateur ;
- aucune IA dans les scores ;
- aucune écriture sur GitHub.
