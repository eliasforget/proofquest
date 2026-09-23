# Intégration GitHub — état v0.4

## Mode actuel

- dépôts publics uniquement ;
- aucune écriture ;
- token `GITHUB_TOKEN` facultatif ;
- REST GitHub utilisé pour métadonnées, langages et arbre récursif ;
- lecture ciblée de fichiers publics pour les preuves profondes ;
- cache court par défaut ;
- `?rescan=1` force les appels concernés en `no-store`.

## Pourquoi ne pas télécharger tout le repository

Le MVP cherche d'abord des signaux ciblés afin de :

- réduire le volume de code lu ;
- limiter les coûts futurs ;
- rendre chaque preuve explicable ;
- rester compatible avec une politique de moindre privilège.

## Limites

- arbre GitHub potentiellement tronqué sur les très gros dépôts ;
- heuristiques de contenu encore basées sur des expressions régulières ;
- monorepos partiellement pris en charge ;
- branches/default refs atypiques à tester davantage ;
- dépôts privés non pris en charge.

## Évolution prévue

Après validation de la boucle produit : GitHub OAuth ou GitHub App avec permissions minimales, puis sélection des repositories de l'utilisateur.
