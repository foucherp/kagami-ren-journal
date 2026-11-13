-- Fiche Vesper : lecture publique par URL, édition réservée au membre Vesper.
-- À exécuter dans Supabase SQL Editor. Ne modifie pas les autres tables.
begin;
create table if not exists public.runner_sheets (
 sheet_id text primary key,
 sheet_data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 constraint runner_sheets_data_object check (jsonb_typeof(sheet_data)='object')
);
alter table public.runner_sheets enable row level security;
revoke all on public.runner_sheets from anon,authenticated;
grant select on public.runner_sheets to anon,authenticated;
grant update on public.runner_sheets to authenticated;
drop policy if exists "Lecture publique fiche Vesper" on public.runner_sheets;
create policy "Lecture publique fiche Vesper" on public.runner_sheets
for select to anon,authenticated using (sheet_id='vesper');
drop policy if exists "Vesper modifie sa fiche" on public.runner_sheets;
create policy "Vesper modifie sa fiche" on public.runner_sheets
for update to authenticated
using (sheet_id='vesper' and exists (
 select 1 from public.opinion_members m
 where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')
))
with check (sheet_id='vesper' and exists (
 select 1 from public.opinion_members m
 where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')
));
insert into public.runner_sheets(sheet_id,sheet_data)
values ('vesper','{}'::jsonb) on conflict(sheet_id) do nothing;
commit;
