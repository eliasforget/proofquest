# Sources techniques vérifiées

Vérification effectuée le **22 septembre 2026**. Ces sources servent à éviter d'inventer des fonctionnalités ou versions.

- Next.js — blog officiel et versions 16.3 : https://nextjs.org/blog
- Next.js 16 : https://nextjs.org/blog/next-16
- React 19.2 : https://react.dev/blog/2025/10/01/react-19-2
- Supabase Auth avec Next.js : https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR : https://supabase.com/docs/guides/auth/server-side
- GitHub OAuth web flow : https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub REST / OAuth applications : https://docs.github.com/en/rest/apps/oauth-applications
- OpenAI — Structured outputs : https://developers.openai.com/api/docs/guides/structured-outputs

## Important

La documentation évolue. Avant d'implémenter une intégration externe, revérifier sa documentation officielle et ses versions. Le prototype ne prétend pas que les intégrations sont déjà actives.

## Sources utilisées pour ProofQuest 0.2

- Next.js — erreurs d'hydratation et extensions navigateur : https://nextjs.org/docs/messages/react-hydration-error
- Next.js — Dynamic Segments / `params` asynchrones : https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- GitHub REST — repository contents : https://docs.github.com/en/rest/repos/contents
- GitHub REST — Git trees (`recursive`) : https://docs.github.com/en/rest/git/trees
- GitHub REST — repositories : https://docs.github.com/en/rest/repos/repos
- GitHub REST — commits / refs : https://docs.github.com/en/rest/commits/commits

L'implémentation 0.2 utilise la version REST GitHub `2026-03-10`, telle qu'indiquée dans les exemples de la documentation officielle consultée le 22/09/2026.

## Sources ajoutées pour ProofQuest 0.3

- Next.js — `cookies`: https://nextjs.org/docs/app/api-reference/functions/cookies
- Next.js — App Router / navigation: https://nextjs.org/docs/app/api-reference/functions/use-router

La persistance de langue de v0.3 utilise l'API de cookies côté serveur de Next.js et `router.refresh()` côté client afin de re-rendre l'interface avec la langue choisie sans ajouter de bibliothèque d'internationalisation.

## Sources ajoutées pour ProofQuest 0.4

- Next.js — `fetch` dans l'App Router, notamment `cache: 'no-store'` et `next.revalidate` : https://nextjs.org/docs/app/api-reference/functions/fetch
- Next.js Learn — `searchParams` asynchrone dans les pages App Router : https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
- GitHub REST — Git Trees, lecture récursive, prise en charge des ressources publiques sans authentification et signal `truncated` : https://docs.github.com/en/rest/git/trees

La v0.4 utilise `cache: 'no-store'` lors d'une réanalyse explicitement demandée. En développement, Next.js documente un cache HMR particulier ; une navigation/recharge complète permet de récupérer les données fraîches, ce qui correspond au bouton GET de réanalyse utilisé ici.
