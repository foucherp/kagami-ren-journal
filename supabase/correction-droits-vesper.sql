-- Autoriser Vesper à modifier les fiches ÉQUIPE et COMMUN
-- sans changer les droits des autres joueurs ni la limite de 30 secondes.
CREATE OR REPLACE FUNCTION public.enforce_character_write_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
 now_at timestamptz := clock_timestamp();
 actor text;
 owner text;
begin
 if auth.uid() is null then return new; end if;
 select m.member_id into actor
 from public.opinion_members m
 where m.email=lower(auth.jwt()->>'email')
 limit 1;
 if actor is null then
  raise exception 'Ce contact ne vous appartient pas.' using errcode='P0001';
 end if;
 owner := new.owner_member_id;
 if not (
   (new.kind=actor and owner=actor)
   or (actor='vesper' and new.kind in ('team','common') and (TG_OP='INSERT' or owner is not distinct from old.owner_member_id))
 ) then
  raise exception 'Propriétaire du contact invalide.' using errcode='P0001';
 end if;
 insert into public.character_write_limits(member_id,last_write_at)
 values (actor,now_at)
 on conflict (member_id) do update
 set last_write_at=excluded.last_write_at
 where public.character_write_limits.last_write_at <= now_at - interval '30 seconds';
 if not found then
  raise exception 'Veuillez patienter 30 secondes entre deux enregistrements de fiches.' using errcode='P0001';
 end if;
 return new;
end;
$function$;