-- Autoriser la modification de l'épisode uniquement pour les contacts communs,
-- et uniquement par Vesper. Les autres identifiants restent immuables.
CREATE OR REPLACE FUNCTION public.guard_character_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
begin
 if new.character_id is distinct from old.character_id
    or new.owner_member_id is distinct from old.owner_member_id
    or new.kind is distinct from old.kind then
  raise exception 'Identité et propriétaire du contact non modifiables';
 end if;
 if new.episode is distinct from old.episode then
  if not (
    old.kind = 'common'
    and exists (
      select 1 from public.opinion_members m
      where m.member_id = 'vesper'
        and m.email = lower(auth.jwt()->>'email')
    )
  ) then
    raise exception 'Épisode non modifiable pour ce contact';
  end if;
 end if;
 new.updated_at=now();
 return new;
end;
$function$;