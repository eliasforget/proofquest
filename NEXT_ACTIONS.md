# Next actions — ProofQuest

## Immediate

1. Tester les 7 familles de quêtes sur plusieurs repositories publics réels.
2. Ajouter une vraie page d'édition du profil : bio, titre et liens publics.
3. Ajouter partage Open Graph / cartes sociales pour les preuves et le profil.
4. Ajouter des événements produit anonymisés : onboarding, scan, quest start, verified completion, proof share.
5. Préparer un petit groupe de bêta-testeurs avant toute acquisition payante.

## Evidence Engine

Graphify continue de signaler `github.ts` comme un hub important. Le transport et le moteur de quêtes sont déjà séparés. Le prochain refactor devra extraire progressivement :
- détection des technologies ;
- détection qualité / CI ;
- détection DevOps / sécurité ;
- calcul des scores de compétences.

## Product rule

Une nouvelle quête doit toujours être liée à des critères vérifiables côté serveur. Ne jamais attribuer de l'XP à partir d'un simple clic ou d'une déclaration utilisateur.
