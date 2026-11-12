-- Renforcement anti-abus du répertoire Kagami Ren.
-- À exécuter APRÈS supabase/avis.sql et import-avis-initiaux.sql.
-- Aucune ligne existante de character_opinions n'est supprimée.

-- 1. Liste blanche des personnages réellement présents dans le répertoire.
create table if not exists public.opinion_characters (
  character_id text primary key
);
alter table public.opinion_characters enable row level security;
revoke all on public.opinion_characters from anon, authenticated;
grant select on public.opinion_characters to anon, authenticated;
drop policy if exists "Lecture des personnages autorisés" on public.opinion_characters;
create policy "Lecture des personnages autorisés" on public.opinion_characters
for select to anon, authenticated using (true);

insert into public.opinion_characters(character_id) values
  ('team:makoto'),
  ('team:naphria'),
  ('team:plurk'),
  ('team:silk'),
  ('team:vesper'),
  ('contact:ash'),
  ('contact:edward-hudson'),
  ('contact:hiroshi-takamura'),
  ('contact:ichida-takako'),
  ('contact:naoko-mizuhara'),
  ('contact:razor'),
  ('contact:yuki-stardust'),
  ('common:s01e00-al-azir'),
  ('common:s01e00-andrew'),
  ('common:s01e00-aranduin'),
  ('common:s01e00-bob'),
  ('common:cassandra'),
  ('common:s01e00-gordon'),
  ('common:s01e00-lauren'),
  ('common:s01e00-lexxxi'),
  ('common:s01e00-loretta'),
  ('common:s01e00-mr-johnson-1'),
  ('common:s01e00-nagaoka'),
  ('common:s01e00-taki'),
  ('common:s01e00-teresa'),
  ('common:s01e00-unknown-1'),
  ('common:s01e00-zhang-wei'),
  ('common:s01e01-big-tonton'),
  ('common:s01e01-hendrix'),
  ('common:s01e01-jill-mclaren'),
  ('common:s01e01-john-lavander'),
  ('common:s01e01-malefice'),
  ('common:s01e01-unknown-2-1'),
  ('common:s01e01-unknown-3-1'),
  ('common:s01e01-unknown-2'),
  ('common:s01e02-marisol-vega'),
  ('common:s01e02-mori'),
  ('common:s01e02-mr-johnson-2'),
  ('common:s01e02-unknown-1'),
  ('common:s01e02-unknown-2-2'),
  ('common:s01e02-unknown-3-2'),
  ('common:s01e02-unknown-4'),
  ('common:s01e02-unknown-5'),
  ('contact:coldline')
on conflict (character_id) do nothing;

-- Une FK interdit toute création d'avis sur un identifiant inconnu.
-- Si la base contient déjà des identifiants étrangers, corriger ces lignes avant
-- d'activer la contrainte (aucune suppression automatique).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='character_opinions_known_character'
      and conrelid='public.character_opinions'::regclass
  ) then
    alter table public.character_opinions
      add constraint character_opinions_known_character
      foreign key (character_id) references public.opinion_characters(character_id);
  end if;
end $$;

-- 2. Limitation : un même joueur ne peut publier ou modifier qu'une fois par minute,
-- même en ciblant plusieurs fiches et même en appelant l'API directement.
-- Table privée : le navigateur n'a aucun droit dessus.
create table if not exists public.opinion_write_limits (
  member_id text primary key,
  last_write_at timestamptz not null
);
revoke all on public.opinion_write_limits from public, anon, authenticated;
alter table public.opinion_write_limits enable row level security;

create or replace function public.enforce_opinion_write_limit()
returns trigger language plpgsql security definer
set search_path = '' as $$
declare
  last_at timestamptz;
  now_at timestamptz := clock_timestamp();
begin
  -- Verrouiller la ligne de l'auteur, ou la créer : protège des requêtes simultanées.
  insert into public.opinion_write_limits(member_id,last_write_at)
  values (new.member_id, now_at)
  on conflict (member_id) do update
    set last_write_at = excluded.last_write_at
    where public.opinion_write_limits.last_write_at <= now_at - interval '60 seconds';

  if not found then
    raise exception 'Veuillez patienter 60 secondes entre deux publications.'
      using errcode='P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_opinion_write_limit() from public,anon,authenticated;
drop trigger if exists enforce_opinion_write_limit on public.character_opinions;
create trigger enforce_opinion_write_limit
before insert or update on public.character_opinions
for each row execute function public.enforce_opinion_write_limit();

-- 3. Bloquer les changements d'auteur ou de personnage lors d'une modification.
create or replace function public.prevent_opinion_reassignment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.member_id is distinct from old.member_id
     or new.character_id is distinct from old.character_id then
    raise exception 'Impossible de réattribuer un avis.';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_opinion_reassignment on public.character_opinions;
create trigger prevent_opinion_reassignment
before update on public.character_opinions
for each row execute function public.prevent_opinion_reassignment();

-- Contrôle de l'état final.
select (select count(*) from public.opinion_characters) as personnages_autorises,
       (select count(*) from public.character_opinions) as avis_en_base;
