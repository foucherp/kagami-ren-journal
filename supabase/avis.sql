-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Les clés publiques restent dans le navigateur ; les droits sont contrôlés par RLS.
create table if not exists public.opinion_members (
  email text primary key,
  member_id text not null unique,
  constraint opinion_members_email_lowercase check (email = lower(email)),
  constraint opinion_members_member_id check (member_id ~ '^[a-z0-9-]+$')
);
create table if not exists public.character_opinions (
  character_id text not null,
  member_id text not null,
  body text not null check (char_length(trim(body)) between 1 and 8000),
  updated_at timestamptz not null default now(),
  primary key (character_id,member_id),
  constraint character_opinions_character_id check (character_id ~ '^[a-z]+:[a-z0-9-]+$')
);
create or replace function public.touch_opinion_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists touch_opinion_updated_at on public.character_opinions;
create trigger touch_opinion_updated_at before update on public.character_opinions
for each row execute function public.touch_opinion_updated_at();
alter table public.opinion_members enable row level security;
alter table public.character_opinions enable row level security;
revoke all on public.opinion_members from anon,authenticated;
revoke all on public.character_opinions from anon,authenticated;
grant select on public.opinion_members to authenticated;
grant select on public.character_opinions to anon,authenticated;
grant insert,update on public.character_opinions to authenticated;
drop policy if exists "Membre : lire sa propre association" on public.opinion_members;
create policy "Membre : lire sa propre association" on public.opinion_members
for select to authenticated using (email = lower(auth.jwt()->>'email'));
drop policy if exists "Tous : lire les avis" on public.character_opinions;
create policy "Tous : lire les avis" on public.character_opinions
for select to anon,authenticated using (true);
drop policy if exists "Membre : publier son avis" on public.character_opinions;
create policy "Membre : publier son avis" on public.character_opinions
for insert to authenticated with check (
 exists (select 1 from public.opinion_members m
         where m.email=lower(auth.jwt()->>'email') and m.member_id=character_opinions.member_id)
);
drop policy if exists "Membre : modifier son avis" on public.character_opinions;
create policy "Membre : modifier son avis" on public.character_opinions
for update to authenticated using (
 exists (select 1 from public.opinion_members m
         where m.email=lower(auth.jwt()->>'email') and m.member_id=character_opinions.member_id)
) with check (
 exists (select 1 from public.opinion_members m
         where m.email=lower(auth.jwt()->>'email') and m.member_id=character_opinions.member_id)
);
-- Ajouter les adresses autorisées dans le SQL Editor (ne PAS mettre d'emails privés dans GitHub) :
-- insert into public.opinion_members(email,member_id) values
--   ('adresse-de-vesper@example.com','vesper'),
--   ('adresse-de-silk@example.com','silk')
-- on conflict(email) do update set member_id=excluded.member_id;
-- Pour un nouveau PJ : ajouter son email et son identifiant (sans changer le code).
