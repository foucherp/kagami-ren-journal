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

## Protection contre les robots (à activer après l'importation)

1. Exécuter [securite-avis.sql](securite-avis.sql) dans le SQL Editor de Supabase. Le script crée la liste blanche des **44 personnages**, interdit les avis sur des identifiants inconnus et limite les écritures à **une par joueur toutes les 60 secondes**, y compris en cas de requêtes API directes. Le contrôle se fait en base et ne supprime pas les avis existants.
2. Dans **Authentication → Settings / Security and Protection**, activer la protection CAPTCHA (hCaptcha ou Cloudflare Turnstile) si vous souhaitez aussi limiter les demandes de liens de connexion automatisées. **Attention :** le CAPTCHA doit également être intégré au formulaire du site avec un jeton valide ; ne l'activer qu'après cette intégration, sinon les connexions par e-mail échoueront. Sans CAPTCHA, les quotas d'envoi de mails Supabase et la liste des membres autorisés protègent la publication, mais pas totalement la création de comptes.
3. Pour empêcher la création de comptes non autorisés, vous pouvez désactiver les inscriptions publiques dans **Authentication → Providers → Email** et créer/inviter les joueurs à l'avance depuis Supabase. **Attention :** cette option nécessite d'inviter chaque nouveau joueur côté administration avant son premier lien magique. Ne pas désactiver les inscriptions tant que les joueurs ne sont pas créés.

Lorsqu'un nouveau personnage est ajouté au manifeste GitHub, ajouter aussi son identifiant dans `opinion_characters` depuis le SQL Editor avant de permettre les avis sur sa fiche :

```sql
insert into public.opinion_characters(character_id)
values ('contact:nouveau-personnage')
on conflict do nothing;
```

Le script de sécurité doit être appliqué côté Supabase : sa seule présence dans GitHub ne protège pas la base.
