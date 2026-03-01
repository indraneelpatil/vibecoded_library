set this up once to enable shared database persistence.

1) create a supabase project.
2) in supabase sql editor, run:

create table if not exists public.library_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.library_state enable row level security;

create policy "public read library state"
on public.library_state
for select
using (true);

create policy "public write library state"
on public.library_state
for insert
with check (true);

create policy "public update library state"
on public.library_state
for update
using (true)
with check (true);

3) add env vars in your vercel project and local env:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

notes:
- this is open write access for now (no auth), so anyone with the app can edit.
- after this works, we can lock editing to your account only.
