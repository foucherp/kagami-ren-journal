-- Journal indépendant d'Hesperis, lecture publique et écriture réservée à Hesperis.
begin;
create table if not exists public.hesperis_journal (
 id text primary key check (id ~ '^HESPERIS_[0-9]{3,}$'),
 entry_data jsonb not null check (jsonb_typeof(entry_data)='object'),
 updated_at timestamptz not null default now()
);
alter table public.hesperis_journal enable row level security;
grant select on public.hesperis_journal to anon,authenticated;
grant insert,update,delete on public.hesperis_journal to authenticated;
drop policy if exists "Journal Hesperis lecture" on public.hesperis_journal;
create policy "Journal Hesperis lecture" on public.hesperis_journal for select to anon,authenticated using (true);
drop policy if exists "Journal Hesperis insertion" on public.hesperis_journal;
create policy "Journal Hesperis insertion" on public.hesperis_journal for insert to authenticated
with check (exists(select 1 from public.opinion_members m where m.member_id='hesperis' and m.email=lower(auth.jwt()->>'email')));
drop policy if exists "Journal Hesperis modification" on public.hesperis_journal;
create policy "Journal Hesperis modification" on public.hesperis_journal for update to authenticated
using (exists(select 1 from public.opinion_members m where m.member_id='hesperis' and m.email=lower(auth.jwt()->>'email')))
with check (exists(select 1 from public.opinion_members m where m.member_id='hesperis' and m.email=lower(auth.jwt()->>'email')));
drop policy if exists "Journal Hesperis suppression" on public.hesperis_journal;
create policy "Journal Hesperis suppression" on public.hesperis_journal for delete to authenticated
using (exists(select 1 from public.opinion_members m where m.member_id='hesperis' and m.email=lower(auth.jwt()->>'email')));
commit;