# Passer de ProofQuest 0.1 à 0.2

## Méthode simple

1. Arrêter le serveur avec `Ctrl+C` dans le terminal où `npm run dev` tourne.
2. Copier le contenu de cette archive dans `C:\Users\elias\Desktop\ProofQuest` et accepter le remplacement des fichiers existants.
3. Ouvrir PowerShell dans `C:\Users\elias\Desktop\ProofQuest\app`.
4. Lancer :

```powershell
npm install
npm run dev
```

5. Ouvrir `http://localhost:3000`.
6. Cliquer sur **Analyze my GitHub**.
7. Tester avec un repository public au format `owner/repository`.

## Pour le warning rouge d'hydratation

La capture montrait qu'un attribut `data-processed-*` était ajouté à `<html>` côté navigateur avant l'hydratation React. Le layout racine de v0.2 contient maintenant :

```tsx
<html lang="en" suppressHydrationWarning>
```

Ce correctif est volontairement limité à l'élément racine. Pour confirmer la cause, vous pouvez aussi tester la page dans une fenêtre de navigation privée sans extensions : si le warning disparaît, l'extension était bien à l'origine de la modification du HTML.

## Tester l'analyse réelle

Exemples de saisie acceptés :

```text
vercel/next.js
https://github.com/vercel/next.js
```

L'analyse publique ne demande pas encore de connexion GitHub.
