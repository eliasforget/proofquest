# Cahier des charges — MVP ProofQuest

## 1. Objectif

Créer une application web capable de transformer l'analyse ciblée d'un dépôt GitHub en un profil visuel de compétences, des preuves consultables et trois quêtes personnalisées.

## 2. Utilisateur cible initial

Développeur web junior / étudiant / alternant avec au moins un dépôt GitHub suffisamment représentatif.

## 3. Parcours critique

```text
Landing → Connexion GitHub → Sélection dépôt → Analyse → Résultat → Partage
```

## 4. Exigences fonctionnelles P0

- afficher une landing page claire ;
- permettre une authentification GitHub avec permissions minimales ;
- lister les dépôts accessibles conformément au consentement ;
- sélectionner un dépôt ;
- analyser un ensemble défini de fichiers/signaux ;
- afficher les technologies détectées ;
- associer chaque compétence à des preuves ;
- afficher un skill graph ;
- proposer trois quêtes ;
- fournir une URL publique optionnelle ;
- permettre de masquer le profil public.

## 5. Exigences non fonctionnelles

- interface desktop et mobile responsive ;
- résultat initial rapide, avec progression visible pendant l'analyse ;
- aucune clé sensible côté client ;
- journaliser les erreurs sans enregistrer inutilement le code source ;
- limiter le volume ingéré et les coûts IA ;
- permettre de supprimer les données d'analyse d'un utilisateur.

## 6. Hors périmètre

Paiement, app mobile native, messagerie, classement mondial, notation des soft skills, analyse privée massive, modification automatique de repositories, recrutement B2B.

## 7. Critères d'acceptation du MVP

Le MVP est testable quand un utilisateur neuf peut suivre le parcours critique sans intervention manuelle du développeur et obtenir un résultat comprenant au moins 5 compétences, des preuves vérifiables et 3 quêtes.
