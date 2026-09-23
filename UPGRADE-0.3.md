# Passer de ProofQuest 0.2 à 0.3

## Installation

1. Arrêter le serveur avec `Ctrl+C`.
2. Copier le contenu de cette version dans `C:\Users\elias\Desktop\ProofQuest` en remplaçant les fichiers existants.
3. Aucun nouveau package npm n'a été ajouté.
4. Relancer :

```powershell
cd C:\Users\elias\Desktop\ProofQuest\app
npm run dev
```

## Langues

ProofQuest prend maintenant en charge :

- Français — `fr` ;
- English — `en` ;
- Deutsch — `de` ;
- Español — `es`.

Le français est la langue par défaut. Le sélecteur en haut de l'interface enregistre la préférence dans le cookie `pq-locale` puis rafraîchit la route courante.

## Skill Detail

Cliquer sur un nœud du graphe pour ouvrir son panneau de détail. Il présente :

- le niveau calculé ;
- le score de preuves ;
- la force des preuves du dépôt ;
- les preuves propres à cette compétence ;
- les chemins des fichiers sources ;
- des liens GitHub vers les fichiers lorsqu'ils existent ;
- le prochain palier proposé ;
- la quête associée lorsque la compétence est ciblée par la quête actuelle.

Le score reste volontairement un **score de preuves du repository** et non un diagnostic de compétence humaine.
