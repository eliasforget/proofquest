# v0.13 — Profils et preuves partageables

## Parcours

`/progress` mène à `/settings/profile`. Le titre (80 caractères), la bio (500 caractères) et jusqu'à trois liens HTTPS (300 caractères chacun) sont enregistrés par une action serveur authentifiée. Le propriétaire est dérivé de `getUser()`, jamais du formulaire. L'identité GitHub, le username, la visibilité et l'XP ne font pas partie du payload d'édition. Vider les champs efface leur contenu. La publication reste un choix explicite via le contrôle existant.

Les profils publics présentent ces informations. Les preuves vérifiées disposent de boutons de partage natif et de copie, également accessibles depuis une quête terminée. Le refus du partage natif n'est pas compté comme succès ; si le presse-papiers échoue, le lien peut être sélectionné manuellement. Un profil privé doit être publié avant de partager sa preuve.

## Aperçus sociaux et confidentialité

Les deux pages publiques produisent des métadonnées localisées et `/api/og` produit une image PNG 1200 × 630 à la demande. Les liens partagés portent `?lang=fr|en|de|es`. Le sélecteur peut remplacer cette langue. La navigation profil ↔ preuve conserve la langue.

Configurer `NEXT_PUBLIC_SITE_URL` avec l'origine publique HTTPS réelle (sans chemin), puis reconstruire l'application. Aucun domaine de production n'est supposé. Sans cette configuration, les titres/descriptions restent disponibles mais les URLs absolues des images et les canoniques sont omises. En local, utiliser `http://localhost:3000`.

Les images et les métadonnées utilisent un client **anonyme** et un filtre `is_public=true`, sans clé de service ni cookies du propriétaire. Les preuves doivent posséder un commit vérifié. Les lectures et les images ne sont pas mises en cache durablement ; un profil privé/inexistant ne produit pas de carte et reçoit `noindex`. Les plateformes tierces peuvent toutefois conserver leurs anciennes copies d'un aperçu déjà partagé.

## Instrumentation

`funnel_events` contient seulement un identifiant de compte, une étape et des dates serveur :

| Étape | Déclenchement |
| --- | --- |
| `login` | Échange OAuth réussi et utilisateur confirmé |
| `scan` | Sauvegarde réussie d'un scan associé au compte |
| `quest_start` | Réponse serveur confirmant une quête active |
| `quest_verified` | Réponse serveur confirmant une nouvelle récompense |
| `proof_share` | Partage natif ou copie réussi par un utilisateur connecté |

Maximum cinq lignes par compte et par jour UTC. Aucun dépôt, URL, bio, IP ou identifiant de visiteur n'est stocké. Les visiteurs anonymes peuvent partager sans événement. Les échecs et doublons ne bloquent pas le parcours. Les événements clients restent **déclaratifs**, ne certifient aucune réalisation et ne sont jamais utilisés pour l'XP. Les totaux mesurent la portée quotidienne des étapes, pas nécessairement une conversion séquentielle du même jour.

Seul le rôle de service peut lire les événements ; un compte authentifié ne peut insérer que ses propres événements, sans fixer leur date, ni les lire/modifier/supprimer. La suppression d'un compte cascade les lignes.

Requête de suivi réservée à l'administration :

```sql
select event_day, event, count(*) as accounts
from public.funnel_events
where event_day >= (now() at time zone 'UTC')::date - 30
group by event_day, event
order by event_day, event;
```

Maintenance à intégrer à l'exploitation (aucun ordonnanceur ajouté implicitement) :

```sql
delete from public.funnel_events
where event_day < (now() at time zone 'UTC')::date - 90;
```

## Migration et livraison

Appliquer `app/supabase/migrations/20260924183917_public_profiles_sharing_funnel.sql` **avant de déployer le frontend v0.13**. Elle ajoute deux colonnes, leurs contraintes, une fonction de validation sans privilège élevé et la table de mesures avec RLS. Elle conserve les politiques de profil et les fonctions/règles anti-farm. Aucune Edge Function n'est modifiée.

L'historique de migrations du projet existant utilise d'autres timestamps que les migrations initiales du dépôt : appliquer uniquement la nouvelle migration, ne pas rejouer aveuglément les anciennes en production. Vérifier préalablement qu'aucune bio existante ne dépasse 500 caractères. En cas de retour au frontend v0.12, ces ajouts peuvent rester en place ; aucune suppression de données n'est nécessaire.

## Validation

`npm ci`, `npm test`, `npm run typecheck`, `npm run build`. Les tests exécutent les migrations dans PostgreSQL embarqué (PGlite), vérifient propriétaire/autre compte/anonyme, les contraintes, le quota quotidien et les interdictions d'écriture XP. Ils couvrent aussi les liens, les quatre dictionnaires et la confidentialité des métadonnées. CI et Graphify s'exécutent sur la PR.

Pour une QA visuelle isolée : lancer `node tests/fixtures/supabase.cjs` depuis `app`, puis `npm run dev` avec `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=qa-public-fixture` et `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. `/u/qa-developer` fournit un profil fictif ; `http://localhost:54329/qa/sign-in` crée une session **fictive locale** pour tester le formulaire. Ce serveur de fixture n'est jamais un service d'authentification réel et ne doit pas être déployé. Les tests SQL assurent les permissions ; la fixture sert uniquement au rendu et aux interactions UI.
