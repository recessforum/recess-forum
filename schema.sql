-- Recess Forum — real schema, replacing the web/.data/db.json dev store.
-- Written for Postgres via Supabase (references auth.users); adjust the
-- auth.users references if a different auth provider is chosen later.
-- See frontend/recess-forum-handoff.md §3 and §10 for the reasoning behind
-- this shape (userId-keyed roles/votes instead of the prototype's
-- display-name lookups and per-browser vote state).

create extension if not exists "pgcrypto";

-- One row per authenticated user. display_name is what the prototype called
-- "author" — unique because posts/comments are still signed by name, but now
-- FK'd to a real user instead of free text.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique,
  role text not null default 'member' check (role in ('member', 'verified_expert', 'admin')),
  expert_type text, -- set when role = 'verified_expert'; one of the EXPERT_TYPES labels
  state char(2), -- derived from zip client-side, never the raw zip (handoff §7)
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  topic_id text not null, -- matches an id in lib/taxonomy.ts; not FK'd since taxonomy is code, not data
  state char(2) not null,
  promo_label text, -- Verified Expert business-mention perk (handoff §6); null unless author is verified
  promo_url text,
  score integer not null default 0,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index posts_topic_id_idx on posts(topic_id);
create index posts_state_idx on posts(state);
create index posts_created_at_idx on posts(created_at desc);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade, -- null for top-level
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);
create index comments_post_id_idx on comments(post_id);
create index comments_parent_id_idx on comments(parent_id);

-- Replaces the prototype's per-browser-session vote state (handoff §2) with
-- one row per (voter, target) so a vote is real, persistent, and de-dupable
-- server-side. dir is the voter's current direction; deleting the row (or
-- setting it to the opposite of a re-click) is how "undo" and "flip" work.
create table votes (
  voter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  dir smallint not null check (dir in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (voter_id, target_type, target_id)
);
create index votes_target_idx on votes(target_type, target_id);

-- Replaces the prototype's in-memory `Set` for view dedup (handoff §2).
create table post_views (
  post_id uuid not null references posts(id) on delete cascade,
  viewer_id uuid not null references profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (post_id, viewer_id)
);

-- Replaces the prototype's write-only AUTHOR_ROLES + expertApplications
-- queue (handoff §2, §10 item 3) with a real reviewable workflow.
create table expert_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references profiles(id) on delete cascade,
  expert_type text not null,
  credential_info text not null,
  file_path text, -- storage object path once real file upload ships (handoff §10 item 5)
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up, so `profiles` never lags
-- behind `auth.users`. Picks up the nickname passed as signup metadata
-- (`options.data.display_name`, see app/signup/page.tsx), falling back to a
-- generated name, and disambiguates on a collision. `set search_path = public`
-- is required — security definer functions run with a restricted search_path,
-- so an unqualified `profiles` reference 42P01s without it or the `public.`
-- prefix used below.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'user_' || substr(new.id::text, 1, 8));
begin
  begin
    insert into public.profiles (id, display_name) values (new.id, chosen_name);
  exception when unique_violation then
    insert into public.profiles (id, display_name) values (new.id, chosen_name || '_' || substr(new.id::text, 1, 4));
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security — starting point, not a finished policy set.
-- Forum content is public read; writes require the acting user to be the
-- author. Approving expert applications and promoting roles must go through
-- a service-role admin action, not client-side RLS (handoff §10 item 3-4:
-- admin review is manual, so don't let users self-approve).
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table post_views enable row level security;
alter table expert_applications enable row level security;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update their own profile" on profiles for update using (auth.uid() = id);

create policy "posts are publicly readable" on posts for select using (true);
create policy "authenticated users create posts as themselves" on posts for insert with check (auth.uid() = author_id);

create policy "comments are publicly readable" on comments for select using (true);
create policy "authenticated users create comments as themselves" on comments for insert with check (auth.uid() = author_id);

create policy "users manage their own votes" on votes for all using (auth.uid() = voter_id) with check (auth.uid() = voter_id);

create policy "users record their own views" on post_views for insert with check (auth.uid() = viewer_id);
create policy "users read their own view history" on post_views for select using (auth.uid() = viewer_id);

create policy "users read their own applications" on expert_applications for select using (auth.uid() = applicant_id);
create policy "authenticated users submit applications as themselves" on expert_applications for insert with check (auth.uid() = applicant_id);
-- Reviewing (status/reviewed_by/reviewed_at updates) is intentionally left
-- to a service-role admin route, not a client-facing RLS policy.
