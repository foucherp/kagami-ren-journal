-- Après supabase/ajout-hesperis.sql, créer la fiche d'équipe Hesperis.
-- Les champs provisoires seront complétés quand le joueur aura défini son personnage.
begin;
insert into public.characters(character_id,name,role,kind,episode,image,legacy_path,info,owner_member_id,image_storage_path)
values (
 'team:hesperis','Hesperis','Magicien','team',null,
 'images/Hesperis.jpeg',null,
 '{"nom":"Hesperis","role":"Magicien","identite_civile":"Inconnue","metatype":"Elfe","affiliation":"TEAM","statut":"Actif","description":"Magicien elfe, nouveau membre de l’équipe. Son parcours reste à découvrir."}'::jsonb,
 null,'Hesperis.jpeg'
)
on conflict (character_id) do update set name=excluded.name,role=excluded.role,image=excluded.image,info=excluded.info,image_storage_path=excluded.image_storage_path;
insert into public.opinion_characters(character_id)
values ('team:hesperis') on conflict do nothing;
commit;
