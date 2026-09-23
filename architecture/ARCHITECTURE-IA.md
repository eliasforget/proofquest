# Architecture IA

## Rôle de l'IA

L'IA intervient **après** le moteur déterministe.

Entrée :

- compétences détectées ;
- preuves structurées ;
- métadonnées pertinentes ;
- contraintes de sortie.

Sortie structurée :

- résumé du profil ;
- explication courte par compétence ;
- trois quêtes ;
- critères de réussite proposés.

## Contrainte anti-hallucination

Le prompt doit interdire l'invention de technologies ou preuves. Les éléments factuels retournés doivent référencer un `evidence_id` existant.

## Sorties structurées

Utiliser la fonctionnalité de sortie structurée disponible dans l'API OpenAI au moment de l'implémentation et valider le résultat côté serveur avec un schéma.

## Modèle

Ne pas figer un identifiant de modèle dans l'architecture. Choisir au moment du développement un modèle actuel adapté au compromis coût/qualité, puis le rendre configurable par variable d'environnement.

## Sécurité

Le contenu de repository est non fiable. Le séparer clairement des instructions système/développeur et empêcher les fichiers du repo de redéfinir la tâche.
