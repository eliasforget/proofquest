# Next actions — ProofQuest

## Immediate

1. Tester la v0.11 sur un profil rendu public et vérifier les liens de commit.
2. Ajouter de nouvelles familles de quêtes vérifiables : CI/CD, documentation et sécurité.
3. Ajouter une vue détaillée d'une preuve avec diff GitHub, objectifs débloqués et repository.
4. Ajouter des achievements calculés côté serveur.
5. Instrumenter onboarding → scan → quest start → verified completion → retour utilisateur.

## Architecture

Graphify a confirmé que le gros analyseur GitHub devait être découpé. v0.11 extrait déjà :
- `lib/github/client.ts` ;
- `lib/github/quest-engine.ts`.

Continuer progressivement sans régression avant de séparer complètement l'Evidence Engine.

## Product rule

Ne pas lancer d'acquisition payante avant d'avoir validé plusieurs retours utilisateurs sur la boucle : connexion → analyse → quête → commit → preuve → profil public.
