# Les prochaines actions — ProofQuest v0.4

## Cible atteinte dans v0.4

ProofQuest sait maintenant :

1. analyser un dépôt GitHub public ;
2. lire plusieurs configurations ciblées au lieu de seulement détecter leur présence ;
3. vérifier des signaux TypeScript, testing, CI, Docker et Kubernetes plus profonds ;
4. cocher les objectifs d'une quête avec de vraies preuves ;
5. forcer une réanalyse fraîche ;
6. comparer deux scans localement ;
7. détecter qu'une quête est devenue validable entre deux états du dépôt ;
8. fonctionner en français, anglais, allemand et espagnol.

## Sprint suivant — v0.5 : vraie boucle de jeu

Objectif : transformer la quête suggérée en **contrat de progression persistant**, avant même d'ajouter l'IA.

### Priorité 1 — accepter une quête

Ajouter un bouton « Lancer cette quête » qui enregistre :

- le type de quête ;
- les objectifs initiaux ;
- le scan de référence ;
- la date de démarrage ;
- la récompense prévue.

### Priorité 2 — validation après rescan

Après une modification GitHub :

```text
quête active
   ↓
commit / push
   ↓
Réanalyser
   ↓
nouvelles preuves
   ↓
objectifs comparés au scan de référence
   ↓
QUÊTE TERMINÉE
```

Afficher une animation de victoire seulement quand les preuves exigées sont réellement apparues.

### Priorité 3 — XP local expérimental

Créer un wallet XP local pour tester la sensation de progression :

- XP de quête séparé du score de preuves ;
- historique des quêtes terminées ;
- aucune prétention de sécurité ou de persistance durable à ce stade.

### Priorité 4 — préparer la persistance serveur

Une fois la boucle agréable :

- GitHub OAuth ;
- Supabase Auth/Postgres ;
- profils utilisateurs ;
- scans persistés ;
- quêtes persistées ;
- XP serveur.

L'IA vient ensuite pour expliquer et générer des quêtes plus fines, jamais pour inventer les preuves.
