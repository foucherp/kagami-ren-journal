-- Journal de Vesper : table, droits et migration sans perte.
-- Exécuter une fois dans Supabase SQL Editor.
begin;
create table if not exists public.vesper_journal (
 id text primary key check (id ~ '^VESPER_[0-9]{3,}$'),
 entry_data jsonb not null check (jsonb_typeof(entry_data)='object'),
 updated_at timestamptz not null default now()
);
alter table public.vesper_journal enable row level security;
grant select on public.vesper_journal to anon,authenticated;
grant insert,update on public.vesper_journal to authenticated;
drop policy if exists "Journal : lecture publique" on public.vesper_journal;
create policy "Journal : lecture publique" on public.vesper_journal for select to anon,authenticated using (true);
drop policy if exists "Journal : insertion Vesper" on public.vesper_journal;
create policy "Journal : insertion Vesper" on public.vesper_journal for insert to authenticated
with check (exists(select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')));
drop policy if exists "Journal : modification Vesper" on public.vesper_journal;
create policy "Journal : modification Vesper" on public.vesper_journal for update to authenticated
using (exists(select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')))
with check (exists(select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')));
drop policy if exists "Journal : suppression Vesper" on public.vesper_journal;
create policy "Journal : suppression Vesper" on public.vesper_journal for delete to authenticated
using (exists(select 1 from public.opinion_members m where m.member_id='vesper' and m.email=lower(auth.jwt()->>'email')));
grant delete on public.vesper_journal to authenticated;
commit;
-- La migration des quatre archives existantes se lance automatiquement
-- lors de la première visite du VLOG par Vesper connecté.
-- Le site conserve journal.js comme secours jusqu'à l'import réussi.
