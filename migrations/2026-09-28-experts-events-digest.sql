-- 1. Expert profile pages ----------------------------------------------------
-- A short bio and practice website shown on a Verified Expert's profile.
-- Users already update their own profile row; lengths are capped here and the
-- API only lets verified experts set them.
alter table profiles add column if not exists bio text check (bio is null or char_length(bio) <= 400);
alter table profiles add column if not exists website text check (website is null or (char_length(website) <= 200 and website ~ '^https://'));

-- 2. Office Hours --------------------------------------------------------------
-- A scheduled window when a Verified Expert answers questions in one thread.
-- The Q&A itself happens in the linked post's comments.
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  host_id uuid references profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 140),
  description text check (description is null or char_length(description) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  created_at timestamptz not null default now()
);
create index if not exists events_starts_at_idx on events(starts_at);
alter table events enable row level security;

drop policy if exists "events are public" on events;
create policy "events are public" on events for select using (true);

drop policy if exists "admins manage events" on events;
create policy "admins manage events" on events for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 3. Weekly digest (separate opt-in from per-post topic alerts) ----------------
alter table notification_prefs add column if not exists weekly_digest boolean not null default false;
alter table notification_prefs add column if not exists digest_consented_at timestamptz;
alter table notification_prefs add column if not exists digest_last_sent date;
