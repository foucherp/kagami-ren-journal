-- Autoriser Vesper à gérer les fiches ÉQUIPE et COMMUN.
-- Conserve les droits existants sur les carnets personnels.
begin;
grant select,insert,update on public.characters to authenticated;
drop policy if exists "Vesper : créer équipe et commun" on public.characters;
create policy "Vesper : créer équipe et commun" on public.characters for insert to authenticated
with check (kind in ('team','common') and exists (
 select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')
));
drop policy if exists "Vesper : modifier équipe et commun" on public.characters;
create policy "Vesper : modifier équipe et commun" on public.characters for update to authenticated
using (kind in ('team','common') and exists (
 select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')
))
with check (kind in ('team','common') and exists (
 select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')
));
commit;