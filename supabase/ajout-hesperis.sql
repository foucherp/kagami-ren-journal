-- Accueil du nouveau joueur Hesperis.
-- Exécuter dans Supabase SQL Editor avant sa première création de contact.
-- Préserve tous les personnages, contacts et avis existants.
begin;
do $$
declare constraint_name text;
begin
 for constraint_name in
  select c.conname from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public' and t.relname='characters'
    and c.contype='c' and pg_get_constraintdef(c.oid) like '%kind%'
 loop
  execute format('alter table public.characters drop constraint %I',constraint_name);
 end loop;
end $$;
alter table public.characters
 add constraint characters_kind_check
 check (kind in ('team','common','vesper','silk','makoto','plurk','naphria','hesperis'));
commit;
-- Une fois son e-mail connu, associer le compte via :
-- insert into public.opinion_members(email,member_id)
-- values (lower('EMAIL_DU_JOUEUR'),'hesperis')
-- on conflict (email) do update set member_id=excluded.member_id;
-- Ne jamais enregistrer son e-mail dans le dépôt GitHub.
