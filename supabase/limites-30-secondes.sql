-- Limite indépendante de 30 secondes par joueur et par type d'action.
-- À exécuter une seule fois dans Supabase SQL Editor (rôle postgres).
-- Aucune fiche, aucun avis ni portrait n'est supprimé.
begin;

create or replace function public.enforce_opinion_write_limit()
returns trigger language plpgsql security definer
set search_path = '' as $$
declare now_at timestamptz := clock_timestamp();
begin
 insert into public.opinion_write_limits(member_id,last_write_at)
 values (new.member_id,now_at)
 on conflict (member_id) do update
 set last_write_at=excluded.last_write_at
 where public.opinion_write_limits.last_write_at <= now_at - interval '30 seconds';
 if not found then
  raise exception 'Veuillez patienter 30 secondes entre deux publications d''avis.'
  using errcode='P0001';
 end if;
 return new;
end;
$$;
-- Le trigger existant sur character_opinions continue d'utiliser cette fonction.

create table if not exists public.character_write_limits (
 member_id text primary key,
 last_write_at timestamptz not null
);
revoke all on public.character_write_limits from public,anon,authenticated;
alter table public.character_write_limits enable row level security;

create or replace function public.enforce_character_write_limit()
returns trigger language plpgsql security definer
set search_path = '' as $$
declare
 now_at timestamptz := clock_timestamp();
 actor text;
begin
 -- Ne compter que les créations et modifications effectuées par un joueur connecté.
 -- Les migrations administratives ne sont pas soumises à cette limite.
 if auth.uid() is null then return new; end if;
 actor := new.owner_member_id;
 if actor is null or new.kind is distinct from actor then
  raise exception 'Propriétaire du contact invalide.' using errcode='P0001';
 end if;
 if not exists (
  select 1 from public.opinion_members m
  where m.member_id=actor and m.email=lower(auth.jwt()->>'email')
 ) then
  raise exception 'Ce contact ne vous appartient pas.' using errcode='P0001';
 end if;
 insert into public.character_write_limits(member_id,last_write_at)
 values (actor,now_at)
 on conflict (member_id) do update
 set last_write_at=excluded.last_write_at
 where public.character_write_limits.last_write_at <= now_at - interval '30 seconds';
 if not found then
  raise exception 'Veuillez patienter 30 secondes entre deux enregistrements de fiches.'
  using errcode='P0001';
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_character_write_limit() from public,anon,authenticated;
drop trigger if exists enforce_character_write_limit on public.characters;
create trigger enforce_character_write_limit
before insert or update on public.characters
for each row execute function public.enforce_character_write_limit();

commit;
