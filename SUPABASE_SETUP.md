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

-- no public write policies (writes go through server route with service role)

3) add env vars in your vercel project and local env:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OWNER_PASSCODE

notes:
- viewers can read, but only owner mode can write.
- owner mode is unlocked with OWNER_PASSCODE.
