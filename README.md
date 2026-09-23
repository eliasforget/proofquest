# ProofQuest

> **Nom de travail** : ProofQuest. Le nom, le domaine et la disponibilité de marque devront être vérifiés avant tout lancement public.

ProofQuest transforme les preuves réelles présentes dans les projets GitHub d'un développeur en **profil de compétences vivant**, **skill tree RPG**, **quêtes techniques personnalisées** et **portfolio partageable**.

L'objectif du MVP n'est pas de "noter les développeurs". Il est de rendre visibles des preuves concrètes : technologies utilisées, tests, CI, documentation, configuration, pratiques détectables et projets réalisés.

## Commencer ici

1. Ouvrir `prototype/index.html` pour voir immédiatement la vision produit, sans installer quoi que ce soit.
2. Lire `docs/00-START-HERE.md`.
3. Lire `docs/04-MVP.md` pour connaître le périmètre exact à construire.
4. Le squelette Next.js se trouve dans `app/`.
5. Les décisions techniques sont documentées dans `architecture/`.

## Structure

```text
ProofQuest/
├── README.md
├── AI_CONTEXT.md
├── SOURCES.md
├── docs/           # vision, cahier des charges, MVP, roadmap, backlog
├── architecture/   # architecture, données, GitHub, moteur d'analyse, IA
├── design/         # direction artistique, design system, parcours, écrans
├── product/        # personas, valeur, monétisation, métriques
├── research/       # concurrence et idées placées au parking
├── prototype/      # prototype visuel autonome ouvrable dans le navigateur
├── app/            # squelette Next.js / TypeScript du MVP
└── scripts/        # aides locales Windows
```

## État actuel

**Phase 1 — Evidence Engine v0.4.** L'application analyse maintenant des preuves plus profondes dans `tsconfig`, les scripts `package.json`, GitHub Actions, Dockerfile et certains manifests Kubernetes. Les quêtes affichent des objectifs réellement satisfaits ou manquants, et le bouton de réanalyse force un nouveau scan afin de comparer l'état du dépôt avec le scan précédent dans le navigateur.

Supabase, l'authentification utilisateur et l'IA ne sont pas encore branchés. L'historique actuel est volontairement local (`localStorage`) : il sert à valider la boucle de jeu avant d'introduire une persistance serveur.

## Règle produit

Chaque fonctionnalité doit répondre à au moins une de ces questions :

- rend-elle une compétence plus facile à **prouver** ?
- donne-t-elle une prochaine action technique utile ?
- améliore-t-elle le partage ou la compréhension du profil ?
- permet-elle de mesurer l'intérêt réel du marché ?

Sinon, la fonctionnalité va au backlog.


## ProofQuest v0.8

La branche `feat/v0.8-cloud-onboarding` ajoute la première identité cloud réellement exploitable :

- connexion GitHub via Supabase Auth ;
- onboarding connecté avec sélection des dépôts publics ;
- page de progression cloud ;
- profil public opt-in `/u/[username]` ;
- configuration Supabase publique intégrée au projet ;
- migration SQL reproductible ;
- CI GitHub pour typecheck + build.

La connexion OAuth GitHub nécessite encore la création d'une OAuth App GitHub et l'activation du provider GitHub dans Supabase. Le callback provider est :

`https://vlgpwhcrlczyzqtdqqes.supabase.co/auth/v1/callback`


## ProofQuest v0.9

La progression cloud est maintenant reliée au vrai code :

- les scans de vos propres dépôts sont sauvegardés dans Supabase ;
- une quête peut être lancée depuis le dashboard d'un dépôt ;
- la validation finale est effectuée côté serveur sur le dépôt GitHub public ;
- l'XP canonique est attribué une seule fois par dépôt et par type de quête ;
- `/progress` agrège les derniers scans en carte globale multi-repositories.

Le vérificateur est déployé comme Supabase Edge Function `verify-quest`.


## ProofQuest v0.10

La progression n'est plus liée à une égalité fragile entre le propriétaire du dépôt et le username GitHub.

- l'identité GitHub durable (`github_user_id`) est stockée côté serveur ;
- une quête est démarrée par l'Edge Function, avec baseline et heure serveur ;
- la validation exige un commit GitHub de l'utilisateur **postérieur au lancement** ;
- ce commit doit toucher des fichiers pertinents pour la quête ;
- au moins un nouvel objectif doit avoir été débloqué depuis la baseline ;
- les dépôts transférés, collaboratifs et d'organisation peuvent donc être validés sans autoriser le farm d'XP sur n'importe quel dépôt public ;
- les scans multi-repositories acceptent les dépôts où l'utilisateur a une contribution publique reconnue.

Graphify est intégré comme outil de cartographie locale/CI du code dans `app/src`. Les sorties `graphify-out/` sont des artefacts de travail et ne sont pas versionnées.


## ProofQuest v0.11

La page publique devient un véritable **proof portfolio** :

- constellation de compétences multi-repositories ;
- nombre de preuves techniques et de repositories cartographiés ;
- timeline des quêtes vérifiées ;
- lien direct vers le commit GitHub utilisé comme preuve ;
- XP et niveau vérifiés côté serveur.

Les repositories peuvent désormais conserver plusieurs types de quêtes actives simultanément. Le moteur d'analyse expose un **quest deck** et la clé primaire Supabase inclut le type de quête.

Graphify a aussi guidé un premier refactor architectural : le transport GitHub et le moteur de quêtes sont maintenant séparés du gros analyseur `github.ts`.
