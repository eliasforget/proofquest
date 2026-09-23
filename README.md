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
