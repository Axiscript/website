-- Waitlist signups from axiscript.com
-- Project: ghvafuxmusfaolzrwefm (https://ghvafuxmusfaolzrwefm.supabase.co)
--
-- Run this once in the Supabase SQL editor. This pull request does not apply it.
-- Then paste the publishable (anon) key into assets/waitlist-config.js.
--
-- anon can insert a signup and cannot select, update, or delete.
-- The dashboard and service role can still read the table (they bypass RLS).

create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  name text,
  work_type text,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (
    char_length(email) <= 320
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint waitlist_name_length check (
    name is null or char_length(name) between 1 and 120
  ),
  constraint waitlist_work_type check (
    work_type is null
    or work_type in ('Midstream', 'Transmission', 'Distribution', 'Other')
  ),
  constraint waitlist_source_length check (
    char_length(source) between 1 and 40
  )
);

-- Case-insensitive uniqueness. "Ada@Example.com" and "ada@example.com" collide.
create unique index waitlist_email_unique on public.waitlist (lower(email));

comment on table public.waitlist is
  'Waitlist signups from axiscript.com.';

alter table public.waitlist enable row level security;

revoke all on table public.waitlist from public, anon, authenticated;
revoke all on sequence public.waitlist_id_seq from public, anon, authenticated;

-- Identity default needs sequence usage. anon cannot override id or created_at.
grant insert (email, name, work_type, source) on table public.waitlist to anon;
grant usage on sequence public.waitlist_id_seq to anon;

create policy "Anon can insert waitlist rows"
  on public.waitlist
  for insert
  to anon
  with check (true);
