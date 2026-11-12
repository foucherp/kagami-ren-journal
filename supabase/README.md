# Avis collaboratifs : mise en service

Le répertoire utilise **Supabase comme source unique des avis**. Les avis initiaux ont été préparés pour import via `import-avis-initiaux.sql`. Les fichiers JSON ne contiennent plus d'avis. Une sauvegarde intégrale est conservée dans `sauvegarde-avis-avant-migration.json`. Les autres champs et portraits restent hébergés sur GitHub Pages.

## Mise en service (administrateur, une seule fois)

1. Ouvrir le [SQL Editor](https://supabase.com/dashboard/project/alzcnmmxumcqiermylik/sql/new) du projet Supabase.
2. Coller et exécuter le contenu de [supabase/avis.sql](supabase/avis.sql). Il crée les tables et les règles RLS. **Tant que cette étape n'est pas faite, la publication ne fonctionne pas.**
3. Dans **Authentication → URL Configuration**, définir le Site URL à `https://foucherp.github.io/kagami-ren-journal/` et ajouter `https://foucherp.github.io/kagami-ren-journal/repertoire.html*` aux Redirect URLs.
4. Dans **Authentication → Providers → Email**, activer la connexion par lien magique (OTP email). Vérifier le modèle d'email et les limites d'envoi du forfait gratuit.
5. Dans le SQL Editor, autoriser chaque joueur avec son adresse email, par exemple :
   ```sql
   insert into public.opinion_members(email,member_id) values
     ('adresse-joueur-silk@example.com','silk'),
     ('adresse-joueur-vesper@example.com','vesper')
   on conflict(email) do update set member_id=excluded.member_id;
   ```
   Remplacer les adresses d'exemple. Ne jamais committer les vraies adresses email dans GitHub.

## Utilisation par les joueurs

Ouvrir une fiche du répertoire → **Donner mon avis** → saisir son email autorisé → ouvrir le lien reçu (première connexion) → écrire et publier. Les visites suivantes réutilisent normalement la session. Les avis sont immédiatement disponibles à tous après publication.

## Sécurité et évolution

La clé `sb_publishable_` est publique par conception. Les règles RLS n'autorisent chaque joueur connecté qu'à écrire les avis associés à son identifiant d'équipe. L'adresse email de connexion doit correspondre à une entrée de `opinion_members`. Aucun mot de passe ni clé secrète Supabase n'est stocké dans le dépôt.

Les nouveaux membres sont reconnus dans l'interface via les entrées `kind: "team"` de `index-personnages.json`. Leur identifiant d'auteur correspond à la version normalisée de leur nom (ex. `silk`, `vesper`). Leur accès à la publication exige seulement une association email → identifiant dans Supabase.

Les avis sont désormais lus uniquement dans Supabase. Une panne de Supabase rend les avis temporairement indisponibles, sans toucher aux autres informations des fiches. Supprimer un avis nécessite une action d'administration SQL, non proposée dans l'interface.
