# Journal de décisions

## 2026-09-22 — D001 — Construire web avant mobile

**Décision :** MVP web responsive.  
**Raison :** itération et partage plus rapides ; intégration GitHub naturelle ; coût réduit.  
**Alternative :** app mobile native.  
**Impact :** React Native/Expo reste au parking.

## 2026-09-22 — D002 — Evidence first

**Décision :** les règles calculables précèdent l'IA.  
**Raison :** explicabilité et réduction des hallucinations.  
**Impact :** l'IA synthétise et propose, elle ne fabrique pas les preuves.

## 2026-09-22 — D003 — Pas de paiement pendant la validation initiale

**Décision :** tester l'intérêt avec une bêta et une liste d'attente Pro.  
**Raison :** éviter d'ajouter complexité administrative et paiement avant d'avoir un signal marché.

## 2026-09-22 — D004 — Nom ProofQuest provisoire

**Décision :** conserver ProofQuest comme nom de travail.  
**Raison :** cohérent avec preuve + progression.  
**Condition :** vérifier domaine, marques et conflits avant publication.

## 2026-09-22 — D005 — Analyser les repositories publics avant OAuth

**Décision :** construire l'Evidence Engine v0.2 avec les endpoints publics GitHub avant toute connexion de compte.  
**Raison :** valider le cœur de valeur du produit avec moins de permissions, moins de configuration et moins de risques.  
**Impact :** l'OAuth/GitHub App devient une étape ultérieure, nécessaire surtout pour les repositories privés et l'identité utilisateur.

## 2026-09-22 — D006 — GitHub ne détermine pas la séniorité

**Décision :** ne pas convertir les signaux v0.2 en jugement de compétence globale, de séniorité ou d'employabilité.  
**Raison :** la présence de fichiers et dépendances prouve certains choix techniques, pas la maîtrise réelle d'une personne.  
**Impact :** afficher des niveaux de progression produit comme une représentation des preuves détectées, avec détail et limites explicites.


## 2026-09-23 — Internationalisation légère pour le MVP

**Décision :** prendre en charge `fr`, `en`, `de`, `es` avec français par défaut, un dictionnaire TypeScript interne et une préférence persistée dans un cookie.

**Raison :** rendre le produit immédiatement lisible par son créateur et testable dans plusieurs marchés sans ajouter une dépendance i18n avant que le besoin ne se complexifie.

**Alternative rejetée :** ajouter immédiatement une bibliothèque i18n externe et une arborescence de routes localisées.

**Impact :** les textes applicatifs doivent passer par `src/lib/i18n.ts`. Le contenu externe du repository (description GitHub, noms de langages, chemins de fichiers) n'est pas traduit automatiquement.

## 2026-09-23 — Les nœuds du skill graph deviennent inspectables

**Décision :** un clic sur une compétence ouvre ses preuves, chemins sources, score de preuves et prochain palier.

**Raison :** la crédibilité de ProofQuest dépend de la traçabilité du score.

**Alternative rejetée :** conserver un graphe purement décoratif.

**Impact :** chaque future règle de scoring doit produire une preuve inspectable et, si possible, pointer vers sa source.

## 2026-09-23 — Approfondir les preuves avant d'ajouter l'IA

**Décision** : faire de la v0.4 un moteur déterministe capable de lire quelques configurations et workflows ciblés, puis construire le rescan sur ces signaux.

**Raison** : une expérience RPG n'est crédible que si la validation des quêtes repose sur des changements techniques vérifiables.

**Alternative rejetée** : demander directement à une IA de noter le repository ou de décider si une quête est terminée.

**Impact** : davantage de règles techniques à maintenir, mais des résultats inspectables, testables et explicables.

## 2026-09-23 — Historique local avant base de données

**Décision** : comparer les scans avec `localStorage` avant d'ajouter Supabase.

**Raison** : valider d'abord l'intérêt et la sensation de progression sans introduire Auth, migrations et persistance serveur.

**Alternative rejetée** : brancher immédiatement toute l'infrastructure compte utilisateur.

**Impact** : historique non portable entre navigateurs, volontairement temporaire.
