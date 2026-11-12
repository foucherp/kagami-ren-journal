-- ÉTAPE 4 : rendre modifiables les contacts historiques de chaque joueur.
-- Sans toucher aux personnages communs, à l'équipe, aux portraits ni aux avis.
begin;
update public.characters
set owner_member_id=kind
where kind in ('vesper','silk','makoto','plurk','naphria')
  and owner_member_id is null;
-- Accepter les portraits historiques déjà importés dans legacy/ en plus
-- des nouveaux portraits rangés dans le dossier personnel du propriétaire.
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
 and (
  image_storage_path is null
  or image_storage_path like 'players/'||owner_member_id||'/%'
  or image_storage_path like 'legacy/%'
 )
);
commit;
select kind,count(*) as fiches_modifiables
from public.characters
where owner_member_id=kind
group by kind order by kind;
