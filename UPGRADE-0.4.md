# Passer de ProofQuest 0.3 à 0.4

## Installation

Aucune nouvelle dépendance npm n'est nécessaire.

1. arrêter `npm run dev` avec `Ctrl+C` ;
2. remplacer les fichiers avec ceux de la v0.4 ;
3. relancer :

```powershell
cd C:\Users\elias\Desktop\ProofQuest\app
npm run dev
```

## Ce qui change

### Evidence Engine profond

ProofQuest ne se contente plus de constater la présence d'un fichier. Le moteur lit maintenant des contenus ciblés :

- `tsconfig*.json` ;
- `package.json` ;
- `.github/workflows/*.yml|yaml` ;
- Dockerfile ;
- README racine ;
- manifests Kubernetes ciblés.

L'objectif est de distinguer :

```text
workflow présent
```

de :

```text
workflow présent + commande de tests réellement détectée
```

### Quêtes mesurables

Les trois critères de la quête affichent désormais un état réel :

```text
✓ VALIDÉ
○ À FAIRE
```

Le statut provient exclusivement des preuves détectées dans le dépôt.

### Réanalyse

Le bouton **Réanalyser maintenant** lance l'analyse avec `cache: no-store` pour les appels concernés. Le dashboard conserve localement le scan précédent et calcule les différences de preuves/score.

### Limite volontaire

La comparaison utilise actuellement `localStorage`, pas une base de données. Cela permet de tester la boucle produit avant d'ajouter Auth + Supabase.
