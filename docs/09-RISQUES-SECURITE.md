# Risques, confidentialité et sécurité

## Risque 1 — Sur-interpréter le code

Absence de test dans un dépôt ≠ incapacité à tester. Présence d'un framework ≠ maîtrise. Toujours formuler comme : **"preuve observée dans ce dépôt"**.

## Risque 2 — Code privé

Commencer avec dépôts publics si possible. Pour les privés, minimiser ce qui est lu et stocké, documenter précisément les permissions et prévoir suppression.

## Risque 3 — Jetons GitHub

- stockage serveur uniquement ;
- chiffrement/secret manager selon l'hébergeur ;
- ne jamais logger le token ;
- révocation possible ;
- permissions minimales.

## Risque 4 — Prompt injection depuis un repository

README, commentaires et fichiers peuvent contenir des instructions malicieuses. Le contenu d'un repo doit être traité comme **donnée non fiable**, jamais comme instruction pour l'agent IA.

## Risque 5 — Coûts IA

Limiter les fichiers envoyés, résumer localement/déterministiquement d'abord, plafonner la taille et mettre en cache les analyses identiques.

## Risque 6 — Profil public

Profil privé par défaut ou consentement explicite avant publication ; permettre désactivation et suppression.
