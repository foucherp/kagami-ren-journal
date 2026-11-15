-- Après supabase/ajout-hesperis.sql, créer la fiche d'équipe Hesperis.
-- Les champs provisoires seront complétés quand le joueur aura défini son personnage.
begin;
insert into public.characters(character_id,name,role,kind,episode,image,legacy_path,info,owner_member_id)
values (
 'team:hesperis','Hesperis','À préciser','team',null,
 'images/JohnDoe.jpeg',null,
 '{"nom":"Hesperis","role":"À préciser","identite_civile":"Inconnue","metatype":"Inconnu","affiliation":"TEAM","statut":"Actif","description":"Nouveau membre de l’équipe. Profil en cours de création."}'::jsonb,
 null
)
on conflict (character_id) do nothing;
insert into public.opinion_characters(character_id)
values ('team:hesperis') on conflict do nothing;
commit;
