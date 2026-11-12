-- ÉTAPE 3 : création collaborative des contacts. À exécuter APRÈS les deux migrations.
-- Ne supprime aucune fiche ni aucun avis.
begin;
-- Seuls les joueurs enregistrés peuvent écrire des contacts personnels.
grant insert,update on public.characters to authenticated;
drop policy if exists "Joueur : créer son contact" on public.characters;
create policy "Joueur : créer son contact" on public.characters
for insert to authenticated with check (
 owner_member_id is not null and kind=owner_member_id
 and character_id ~ '^contact:[a-z0-9-]+$'
 and exists (select 1 from public.opinion_members m
  where m.email=lower(auth.jwt()->>'email') and m.member_id=owner_member_id)
 and (image_storage_path is null or image_storage_path like 'players/'||owner_member_id||'/%')
);
drop policy if exists "Joueur : modifier son contact" on public.characters;
create policy "Joueur : modifier son contact" on public.characters
for update to authenticated
using (
 owner_member_id is not null and kind=owner_member_id
 and exists (select 1 from public.opinion_members m
  where m.email=lower(auth.jwt()->>'email') and m.member_id=owner_member_id)
)
with check (
 owner_member_id is not null and kind=owner_member_id
 and exists (select 1 from public.opinion_members m
  where m.email=lower(auth.jwt()->>'email') and m.member_id=owner_member_id)
 and (image_storage_path is null or image_storage_path like 'players/'||owner_member_id||'/%')
);
-- Verrouiller l'identité, le propriétaire et les clés de classement.
create or replace function public.guard_character_update()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.character_id is distinct from old.character_id
 or new.owner_member_id is distinct from old.owner_member_id
 or new.kind is distinct from old.kind
 or new.episode is distinct from old.episode then
  raise exception 'Identité et propriétaire du contact non modifiables';
 end if;
 new.updated_at=now();
 return new;
end;$$;
drop trigger if exists guard_character_update on public.characters;
create trigger guard_character_update before update on public.characters
for each row execute function public.guard_character_update();
-- Chaque nouvelle fiche devient automatiquement éligible aux avis.
create or replace function public.register_character_for_opinions()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.opinion_characters(character_id) values(new.character_id)
 on conflict do nothing;
 return new;
end;$$;
revoke all on function public.register_character_for_opinions() from public,anon,authenticated;
drop trigger if exists register_character_for_opinions on public.characters;
create trigger register_character_for_opinions after insert on public.characters
for each row execute function public.register_character_for_opinions();
commit;
-- Vérifier que les politiques existent avant d'activer le formulaire.
select tablename,policyname,cmd from pg_policies
where schemaname='public' and tablename='characters' order by policyname;
