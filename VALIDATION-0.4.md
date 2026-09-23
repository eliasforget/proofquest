# Validation technique — v0.4

## Vérifications exécutées dans l'environnement de génération

- parsing TypeScript/TSX via `tsc --noEmit` avec stubs Next/React adaptés : **OK** ;
- structure des fichiers et imports : **OK** ;
- JSON `package.json` : **OK** ;
- archive ZIP finale : à vérifier après création.

## Non vérifié ici

Le build Next.js complet n'est pas exécuté dans cet environnement car les dépendances `next/react` du projet ne sont pas installées localement dans ce conteneur. La machine Windows de développement possède déjà les dépendances de la v0.3 et la v0.4 n'ajoute aucun package npm.

## Test local recommandé

```powershell
cd C:\Users\elias\Desktop\ProofQuest\app
npm run typecheck
npm run dev
```

Puis :

1. analyser un dépôt public ;
2. vérifier les objectifs cochés de la quête ;
3. modifier/push le dépôt ;
4. cliquer sur **Réanalyser maintenant** ;
5. vérifier le bloc **Évolution entre les scans**.
