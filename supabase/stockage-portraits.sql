-- ETAPE 2 : stockage des portraits et droits des futurs contacts collaboratifs.
-- Exécuter APRÈS supabase/migration-personnages.sql.
-- Les anciens fichiers et les avis restent intacts.
begin;
alter table public.characters add column if not exists owner_member_id text;
alter table public.characters add column if not exists image_storage_path text;
alter table public.characters add constraint characters_owner_kind_check
 check (owner_member_id is null or (kind=owner_member_id and kind not in ('team','common'))) not valid;
-- Ne pas accorder encore l'écriture des fiches : l'interface de création sera activée après vérification de la migration.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('character-portraits','character-portraits',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
-- Tous peuvent voir les portraits. Seuls les joueurs enregistrés peuvent téléverser
-- dans leur dossier personnel, jamais dans les dossiers des autres ou les portraits historiques.
drop policy if exists "Portraits : lecture publique" on storage.objects;
create policy "Portraits : lecture publique" on storage.objects
for select to anon,authenticated using (bucket_id='character-portraits');
drop policy if exists "Portraits : ajout personnel" on storage.objects;
create policy "Portraits : ajout personnel" on storage.objects
for insert to authenticated with check (
 bucket_id='character-portraits'
 and (storage.foldername(name))[1]='players'
 and (storage.foldername(name))[2] in (
   select member_id from public.opinion_members
   where email=lower(auth.jwt()->>'email')
 )
 and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
);
drop policy if exists "Portraits : modification personnelle" on storage.objects;
create policy "Portraits : modification personnelle" on storage.objects
for update to authenticated using (
 bucket_id='character-portraits'
 and (storage.foldername(name))[1]='players'
 and (storage.foldername(name))[2] in (
   select member_id from public.opinion_members
   where email=lower(auth.jwt()->>'email')
 )
) with check (
 bucket_id='character-portraits'
 and (storage.foldername(name))[1]='players'
 and (storage.foldername(name))[2] in (
   select member_id from public.opinion_members
   where email=lower(auth.jwt()->>'email')
 )
);
commit;
select id,public,file_size_limit from storage.buckets where id='character-portraits';
