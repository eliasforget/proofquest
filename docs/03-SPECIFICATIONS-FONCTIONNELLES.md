# Spécifications fonctionnelles

## F01 — Landing

**Entrée** : visite anonyme.  
**Sortie** : compréhension de la promesse et CTA vers GitHub.  
**État erreur** : aucun.

## F02 — Auth GitHub

- demander le minimum de droits requis ;
- expliquer clairement ce qui sera lu ;
- permettre d'annuler ;
- ne jamais demander de droit d'écriture pour le MVP.

## F03 — Sélection d'un dépôt

Afficher : nom, visibilité, langage principal, date de mise à jour, description si présente. Prévoir recherche/filtre à terme. Le MVP peut se limiter aux 30 dépôts les plus récents.

## F04 — Analyse

Étapes visibles :

1. collecte métadonnées ;
2. détection stack ;
3. recherche de preuves ;
4. construction du graph ;
5. génération des quêtes.

L'interface doit distinguer les signaux réellement calculés des éléments générés par IA.

## F05 — Résultat

Contenir :

- niveau de progression interne (gamification, non valeur professionnelle absolue) ;
- catégories : Backend, Frontend, Data, DevOps, Testing, Quality ;
- skill tree ;
- panneau de preuves ;
- 3 quêtes ;
- bouton partager.

## F06 — Preuve

Une preuve possède : type, label, source, confiance, chemin/fichier éventuel, explication courte. Exemple : `CI workflow detected` depuis `.github/workflows/ci.yml`.

## F07 — Quête

Une quête possède : titre, objectif, raison, critères de validation, XP fictive, compétences ciblées. La validation automatique arrive après le MVP initial si nécessaire.

## F08 — Profil public

- opt-in explicite ;
- aucune information privée non nécessaire ;
- possibilité de désactiver immédiatement ;
- URL stable ;
- métadonnées partageables pour réseaux sociaux à terme.
