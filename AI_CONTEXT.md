# AI Context — ProofQuest

Ce fichier sert de contexte de référence pour les futurs assistants et agents de développement.

## Mission

Construire ProofQuest comme un produit web international à forte identité visuelle. Le MVP doit analyser un dépôt GitHub avec des signaux explicables, générer un skill graph basé sur des preuves, proposer quelques quêtes et produire un profil partageable.

## Ce qui est interdit dans le MVP

- présenter une estimation subjective comme une vérité sur le niveau global d'une personne ;
- inventer des preuves absentes du dépôt ;
- écrire sur le dépôt GitHub sans consentement explicite ;
- aspirer tout le code source par défaut si des métadonnées/fichiers ciblés suffisent ;
- construire un réseau social complet ;
- construire une app mobile ;
- ajouter des paiements avant validation d'intérêt ;
- utiliser un modèle IA comme unique source de score.

## Priorités

1. Expérience visuelle mémorable.
2. Analyse traçable et explicable.
3. Temps jusqu'au premier résultat très court.
4. Partage facile.
5. Coût d'infrastructure faible.

## Stack de départ vérifiée au 22/09/2026

- Next.js 16.3.x ; le correctif de sécurité 16.3.3 est publié par Next.js.
- React 19.2.x pour rester sur la base explicitement documentée par Next.js 16 ; ne pas monter de version sans test.
- TypeScript.
- CSS natif au départ pour minimiser les dépendances.
- Supabase envisagé pour Postgres/Auth, avec auth SSR via `@supabase/ssr` lorsque l'intégration sera faite.
- GitHub OAuth/GitHub App à décider après le spike d'intégration ; appliquer le moindre privilège.
- OpenAI : utiliser l'API actuelle et des sorties structurées au moment de l'intégration, sans figer ici un modèle qui pourrait changer.

## Convention de décision

Toute nouvelle fonctionnalité importante doit être inscrite dans `docs/08-JOURNAL-DECISIONS.md` avec : date, décision, raison, alternative rejetée, impact.


## État v0.4 — 23/09/2026

- analyse réelle de dépôts GitHub publics ;
- Evidence Engine déterministe avec lecture ciblée de configs/workflows ;
- TypeScript profond : strict et plusieurs options de sûreté ;
- testing profond : fichiers, runner, script et exécution réelle en CI ;
- Docker profond : Dockerfile, multi-stage, non-root, healthcheck, dockerignore, Compose, docs, CI ;
- Kubernetes : Deployment, Service, probes, ressources ;
- quêtes avec objectifs réellement cochés ;
- rescan frais et comparaison locale entre scans ;
- interface `fr`, `en`, `de`, `es`, français par défaut ;
- aucune IA dans le scoring actuel ;
- aucune persistance serveur ; l'historique local est un prototype de boucle de progression.

Toujours qualifier les nombres actuels de **score de preuves du repository**, pas de note objective du développeur.
