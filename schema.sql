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
  email_notifications_enabled boolean not null default true, -- reply-to-your-post/comment emails
  avatar_url text, -- public URL into the 'avatars' storage bucket; null falls back to initials in the UI
  created_at timestamptz not null default now(),
  nickname_set boolean not null default false -- false means display_name is the auto-generated 'user_xxxxxxxx' placeholder (Google sign-in doesn't supply one); gates the /welcome nickname prompt
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text, -- optional: only the title is required when creating a post
  topic_id text not null, -- matches an id in lib/taxonomy.ts; not FK'd since taxonomy is code, not data
  state char(2) not null,
  promo_label text, -- Verified Expert business-mention perk (handoff §6); null unless author is verified
  promo_url text,
  image_url text, -- public URL into the 'post-images' bucket; one optional photo per post
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
  -- on delete set null (not the default no-action/restrict) — otherwise
  -- deleting an admin's account is permanently blocked by every application
  -- they ever reviewed. Hit this for real deleting a test admin account;
  -- fixed via ALTER on the live DB, reflected here so a fresh deploy matches.
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

-- User-created groups within the forum (not part of the fixed topic
-- taxonomy in lib/taxonomy.ts — circles are open-ended and member-driven).
-- Circle posts stay fully public/searchable like any other post; a circle
-- is a "belonging + filter" layer, not a private-content boundary. If
-- private-only circle posts are ever wanted, that's a separate visibility
-- model on top of this, not a change to this table.
create table circles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  state char(2), -- optional location scoping, same convention as posts.state
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table circle_memberships (
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_memberships_user_idx on circle_memberships(user_id);

-- target_id is deliberately not FK'd (target_type says which table it points
-- into) — a polymorphic reference, same tradeoff as topic_id on posts.
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz
);
create index reports_status_idx on reports(status);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocker_id_idx on blocks(blocker_id);

-- on delete set null, not cascade — deleting a circle shouldn't delete the
-- posts made in it, just detach them (they keep showing up in the main
-- feed/search, same as any other post).
alter table posts add column circle_id uuid references circles(id) on delete set null;
create index posts_circle_id_idx on posts(circle_id);

-- One post the circle's creator can pin to the top of the circle page. Only
-- ever points at a post in that same circle written by the creator (enforced
-- by the update policy below, and again in app/api/circles/[id]/pin).
-- on delete set null so deleting the pinned post just un-pins it.
alter table circles add column pinned_post_id uuid references posts(id) on delete set null;

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
  supplied_name text := nullif(trim(new.raw_user_meta_data->>'display_name'), '');
  chosen_name text := coalesce(supplied_name, 'user_' || substr(new.id::text, 1, 8));
begin
  begin
    insert into public.profiles (id, display_name, nickname_set) values (new.id, chosen_name, supplied_name is not null);
  exception when unique_violation then
    insert into public.profiles (id, display_name, nickname_set) values (new.id, chosen_name || '_' || substr(new.id::text, 1, 4), supplied_name is not null);
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Vote/view mutations, as Postgres functions rather than plain client-side
-- inserts. Both are `security definer` so they can update posts.score/views
-- (which RLS otherwise locks down — see policies below), which means they
-- run with elevated privilege and are reachable directly at
-- /rest/v1/rpc/<name> under the public anon key. Each MUST derive the
-- acting user from auth.uid() internally, never from a caller-supplied
-- parameter — an earlier version took p_voter_id/p_viewer_id as arguments,
-- which would have let anyone vote or record a view as anyone else just by
-- passing a different id. Caught before shipping; don't reintroduce it.
-- ---------------------------------------------------------------------
create function cast_vote(p_target_type text, p_target_id uuid, p_dir smallint, p_post_id uuid default null)
returns table(score integer, dir smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter_id uuid := auth.uid();
  v_prev_dir smallint;
  v_new_dir smallint;
  v_delta integer;
  v_new_score integer;
begin
  if v_voter_id is null then
    raise exception 'not authenticated';
  end if;

  select v.dir into v_prev_dir from public.votes v
    where v.voter_id = v_voter_id and v.target_type = p_target_type and v.target_id = p_target_id;
  v_prev_dir := coalesce(v_prev_dir, 0);
  v_new_dir := case when v_prev_dir = p_dir then 0 else p_dir end;
  v_delta := v_new_dir - v_prev_dir;

  if v_new_dir = 0 then
    delete from public.votes where voter_id = v_voter_id and target_type = p_target_type and target_id = p_target_id;
  else
    insert into public.votes (voter_id, target_type, target_id, dir) values (v_voter_id, p_target_type, p_target_id, v_new_dir)
    on conflict (voter_id, target_type, target_id) do update set dir = excluded.dir;
  end if;

  -- `score` here is ambiguous between the table column and the RETURNS
  -- TABLE(score, ...) output column, which plpgsql also treats as an
  -- in-scope variable — Postgres refuses to guess and errors 42702 on
  -- every call. Qualifying with the table alias is required, not stylistic.
  if p_target_type = 'post' then
    update public.posts as p set score = p.score + v_delta where p.id = p_target_id returning p.score into v_new_score;
  else
    update public.comments as c set score = c.score + v_delta where c.id = p_target_id returning c.score into v_new_score;
  end if;

  return query select v_new_score, v_new_dir;
end;
$$;

-- No-ops (returns the current count) for a logged-out caller — dedup is
-- only meaningful once there's a real auth.uid() to key it on.
create function increment_post_view(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer_id uuid := auth.uid();
  v_new_views integer;
begin
  if v_viewer_id is null then
    select views into v_new_views from public.posts where id = p_post_id;
    return v_new_views;
  end if;

  insert into public.post_views (post_id, viewer_id) values (p_post_id, v_viewer_id)
  on conflict (post_id, viewer_id) do nothing;
  if found then
    update public.posts set views = views + 1 where id = p_post_id returning views into v_new_views;
  else
    select views into v_new_views from public.posts where id = p_post_id;
  end if;
  return v_new_views;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security — starting point, not a finished policy set.
-- Forum content is public read; writes require the acting user to be the
-- author. Reviewing expert applications and promoting roles go through
-- admin-only RLS policies below (auth.uid() must own a profiles row with
-- role = 'admin') rather than a service-role route — there's no service
-- role key on hand in this environment, and the exists-subquery pattern
-- composes cleanly with the existing per-user policies (Postgres ORs
-- policies for the same command together). Admin review is still manual:
-- nothing here lets a user self-promote, since the check reads the row's
-- *current* role, not anything the request itself supplies.
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table post_views enable row level security;
alter table expert_applications enable row level security;
alter table circles enable row level security;
alter table circle_memberships enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update their own profile" on profiles for update using (auth.uid() = id);
create policy admin_update_any_profile on profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Not a plain "using (true)" anymore — a row is hidden from a viewer who has
-- blocked its author. For a logged-out viewer (auth.uid() is null) the
-- exists() subquery can never match, so nothing changes for anon browsing.
create policy "posts are publicly readable" on posts for select using (
  not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = posts.author_id)
);
-- Posting into a circle additionally requires membership in that circle —
-- enforced here (not just in the API route) since posts are insertable
-- directly at /rest/v1/posts under the anon key.
create policy "authors update their own posts" on posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete their own posts" on posts for delete using (auth.uid() = author_id);

create policy "authenticated users create posts as themselves" on posts for insert with check (
  auth.uid() = author_id
  and (
    circle_id is null
    or exists (select 1 from public.circle_memberships cm where cm.circle_id = posts.circle_id and cm.user_id = auth.uid())
  )
);

create policy "comments are publicly readable" on comments for select using (
  not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = comments.author_id)
);
create policy "authenticated users create comments as themselves" on comments for insert with check (auth.uid() = author_id);

create policy "circles are publicly readable" on circles for select using (true);
create policy "authenticated users create circles as themselves" on circles for insert with check (auth.uid() = created_by);
create policy "creators update their circles" on circles for update
  using (auth.uid() = created_by)
  with check (
    auth.uid() = created_by
    and (
      pinned_post_id is null
      or exists (
        select 1 from public.posts p
        where p.id = circles.pinned_post_id and p.circle_id = circles.id and p.author_id = auth.uid()
      )
    )
  );

create policy "circle memberships are publicly readable" on circle_memberships for select using (true);
create policy "users join circles as themselves" on circle_memberships for insert with check (auth.uid() = user_id);
create policy "users leave circles themselves" on circle_memberships for delete using (auth.uid() = user_id);

create policy "users manage their own votes" on votes for all using (auth.uid() = voter_id) with check (auth.uid() = voter_id);

create policy "users record their own views" on post_views for insert with check (auth.uid() = viewer_id);
create policy "users read their own view history" on post_views for select using (auth.uid() = viewer_id);

create policy "users read their own applications" on expert_applications for select using (auth.uid() = applicant_id);
create policy "authenticated users submit applications as themselves" on expert_applications for insert with check (auth.uid() = applicant_id);
create policy admin_read_all_applications on expert_applications for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy admin_update_applications on expert_applications for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "users submit reports as themselves" on reports for insert with check (auth.uid() = reporter_id);
create policy "users read their own reports" on reports for select using (auth.uid() = reporter_id);
create policy admin_read_all_reports on reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy admin_update_reports on reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- "for all" covers select/insert/update/delete with the same predicate —
-- users only ever see and manage blocks where they're the blocker.
create policy "users manage their own blocks" on blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------
-- Storage — real credential file uploads for expert_applications.file_path
-- (handoff §10 item 5). Private bucket; applicants upload straight from the
-- browser (anon key + their own session), no service-role route needed.
-- Object paths are namespaced "{auth.uid()}/...", which is what the
-- policies below key off via storage.foldername(name)[1] — the API route
-- that inserts the application row also checks this prefix server-side so
-- a forged file_path can't point at someone else's object.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('expert-credentials', 'expert-credentials', false)
on conflict (id) do nothing;

create policy "applicants upload their own credential files"
on storage.objects for insert
with check (
  bucket_id = 'expert-credentials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "applicants read their own credential files"
on storage.objects for select
using (
  bucket_id = 'expert-credentials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "admins read all credential files"
on storage.objects for select
using (
  bucket_id = 'expert-credentials'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ---------------------------------------------------------------------
-- Storage — profile picture uploads (profiles.avatar_url). Public bucket,
-- unlike expert-credentials — an avatar is meant to be visible to anyone
-- viewing a post/comment, not gated behind auth. Same own-uid-folder
-- write pattern as the credentials bucket, just with public read instead
-- of self-and-admin-only read.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "users upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------
-- Storage — one optional photo per post (posts.image_url). Public bucket,
-- same own-uid-folder RLS pattern as avatars — a post's photo is public
-- content like the post itself, no admin-only read needed.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post images are publicly accessible"
on storage.objects for select
using (bucket_id = 'post-images');

create policy "users upload their own post images"
on storage.objects for insert
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete their own post images"
on storage.objects for delete
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------
-- Storage — one optional video per post (posts.video_url). Public bucket,
-- same own-uid-folder RLS pattern as post-images. 50MB cap matches the
-- Supabase free-tier per-file limit; mp4/mov/webm only.
-- ---------------------------------------------------------------------
alter table posts add column video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-videos', 'post-videos', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "post videos are publicly accessible"
on storage.objects for select
using (bucket_id = 'post-videos');

create policy "users upload their own post videos"
on storage.objects for insert
with check (
  bucket_id = 'post-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete their own post videos"
on storage.objects for delete
using (
  bucket_id = 'post-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------
-- 2026-09-24: account type, Founding Parent numbers, admin email export,
-- privileged-column guard. Same as migrations/2026-09-24-account-type-founding.sql.
-- ---------------------------------------------------------------------
-- Account type (parent / provider), Founding Parent numbers, admin email export,
-- and a guard on privileged profile columns.
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.

-- 1. New columns -------------------------------------------------------------
alter table profiles add column if not exists account_type text
  check (account_type in ('parent', 'provider'));
-- Permanent, gap-free 1..500 for the first 500 parents. Stored (not computed
-- from created_at) so a badge never moves once earned and the list can be
-- exported for emails.
alter table profiles add column if not exists founding_number integer unique;

-- 2. Guard privileged columns --------------------------------------------------
-- The "users update their own profile" policy has no column restriction, so
-- without this a signed-in user could PATCH their own row through the REST API
-- and set role = 'admin', or hand themselves a founding number. Admins (via
-- their own policy), the SQL editor / service role (no auth.uid()), and the
-- set_account_type() function below (which sets recess.trusted) may still
-- change them.
create or replace function guard_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;
  if current_setting('recess.trusted', true) = 'on' then return new; end if;
  if exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') then return new; end if;
  if new.role is distinct from old.role
     or new.expert_type is distinct from old.expert_type
     or new.account_type is distinct from old.account_type
     or new.founding_number is distinct from old.founding_number then
    raise exception 'These profile fields can only be changed by an admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileged on profiles;
create trigger guard_profile_privileged
  before update on profiles
  for each row execute function guard_profile_privileged_columns();

-- 3. Choosing an account type ---------------------------------------------------
-- Called by the signed-in user once, right after signup (or on first visit for
-- accounts that existed before this). A parent gets the next founding number
-- while fewer than 500 have been handed out. The choice can't be changed by
-- the user afterward (an admin can fix mistakes in the SQL editor).
create or replace function set_account_type(p_type text)
returns table(out_account_type text, out_founding_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_type text;
  taken integer;
begin
  if uid is null then raise exception 'Log in first.'; end if;
  if p_type not in ('parent', 'provider') then raise exception 'Unknown account type.'; end if;

  select p.account_type into current_type from profiles p where p.id = uid for update;
  if current_type is null then
    perform set_config('recess.trusted', 'on', true);
    update profiles set account_type = p_type where id = uid;
    if p_type = 'parent' then
      -- Serialize number assignment so two simultaneous signups can't both take #N.
      perform pg_advisory_xact_lock(500500);
      select count(*) into taken from profiles where founding_number is not null;
      if taken < 500 then
        update profiles set founding_number = taken + 1 where id = uid;
      end if;
    end if;
  end if;

  return query select p.account_type, p.founding_number from profiles p where p.id = uid;
end;
$$;

revoke all on function set_account_type(text) from public, anon;
grant execute on function set_account_type(text) to authenticated;

-- 4. Admin email export ---------------------------------------------------------
-- Emails live in auth.users, which the client can't read. This returns them to
-- admins only. p_scope: 'founding' | 'parents' | 'providers' | 'unset' | 'all'.
create or replace function admin_member_emails(p_scope text default 'founding')
returns table(founding_number integer, display_name text, email text, account_type text, joined_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admins only.';
  end if;
  return query
    select p.founding_number, p.display_name, u.email::text, p.account_type, p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    where case p_scope
      when 'founding' then p.founding_number is not null
      when 'parents' then p.account_type = 'parent'
      when 'providers' then p.account_type = 'provider'
      when 'unset' then p.account_type is null
      else true
    end
    order by p.founding_number nulls last, p.created_at;
end;
$$;

revoke all on function admin_member_emails(text) from public, anon;
grant execute on function admin_member_emails(text) to authenticated;

-- ---------------------------------------------------------------------
-- 2026-09-25: countries outside the US, media on circles and replies.
-- Same as migrations/2026-09-25-countries-and-media.sql.
-- ---------------------------------------------------------------------
-- Locations outside the US, plus photos/videos on circles and replies.
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.

-- Posts: US posts keep a state code with country 'US'; posts from elsewhere
-- store the ISO country code and leave state null.
alter table posts add column if not exists country char(2) not null default 'US';
alter table posts alter column state drop not null;
do $$ begin
  alter table posts add constraint posts_us_needs_state check (country <> 'US' or state is not null);
exception when duplicate_object then null; end $$;

-- Circles: location stays optional. country null = not tied to a place.
alter table circles add column if not exists country char(2);
update circles set country = 'US' where state is not null and country is null;
alter table circles add column if not exists image_url text;
alter table circles add column if not exists video_url text;

-- Replies: one optional photo or video each. Files go in the existing
-- post-images / post-videos buckets under the uploader's own folder, so no new
-- storage policies are needed.
alter table comments add column if not exists image_url text;
alter table comments add column if not exists video_url text;

-- ---------------------------------------------------------------------
-- 2026-09-25: third account type (expert). Same as migrations/2026-09-25-expert-account-type.sql.
-- ---------------------------------------------------------------------
-- Third account type: 'expert' (professionals who may not run a business:
-- teachers, school psychologists, therapists, independent consultants).
-- Only parents get Founding Parent numbers. Run in Supabase SQL Editor; safe to re-run.

alter table profiles drop constraint if exists profiles_account_type_check;
alter table profiles add constraint profiles_account_type_check
  check (account_type in ('parent', 'provider', 'expert'));

create or replace function set_account_type(p_type text)
returns table(out_account_type text, out_founding_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_type text;
  taken integer;
begin
  if uid is null then raise exception 'Log in first.'; end if;
  if p_type not in ('parent', 'provider', 'expert') then raise exception 'Unknown account type.'; end if;

  select p.account_type into current_type from profiles p where p.id = uid for update;
  if current_type is null then
    perform set_config('recess.trusted', 'on', true);
    update profiles set account_type = p_type where id = uid;
    if p_type = 'parent' then
      perform pg_advisory_xact_lock(500500);
      select count(*) into taken from profiles where founding_number is not null;
      if taken < 500 then
        update profiles set founding_number = taken + 1 where id = uid;
      end if;
    end if;
  end if;

  return query select p.account_type, p.founding_number from profiles p where p.id = uid;
end;
$$;

revoke all on function set_account_type(text) from public, anon;
grant execute on function set_account_type(text) to authenticated;

create or replace function admin_member_emails(p_scope text default 'founding')
returns table(founding_number integer, display_name text, email text, account_type text, joined_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admins only.';
  end if;
  return query
    select p.founding_number, p.display_name, u.email::text, p.account_type, p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    where case p_scope
      when 'founding' then p.founding_number is not null
      when 'parents' then p.account_type = 'parent'
      when 'providers' then p.account_type = 'provider'
      when 'experts' then p.account_type = 'expert'
      when 'unset' then p.account_type is null
      else true
    end
    order by p.founding_number nulls last, p.created_at;
end;
$$;

revoke all on function admin_member_emails(text) from public, anon;
grant execute on function admin_member_emails(text) to authenticated;

-- ---------------------------------------------------------------------
-- 2026-09-25: circle profile pictures (admin only). Same as migrations/2026-09-25-circle-avatar.sql.
-- ---------------------------------------------------------------------
-- Circle profile pictures, set by admins only. Run in Supabase SQL Editor; safe to re-run.

alter table circles add column if not exists avatar_url text;

-- Admins may update any circle (creators keep their own pin-only policy).
drop policy if exists admins_update_any_circle on circles;
create policy admins_update_any_circle on circles for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- The creator update policy has no column restriction, so guard avatar_url:
-- only admins (or the SQL editor / service role) can change it.
create or replace function guard_circle_avatar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.avatar_url is distinct from old.avatar_url
     and auth.uid() is not null
     and not exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Only admins can change a circle''s picture.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_circle_avatar on circles;
create trigger guard_circle_avatar
  before update on circles
  for each row execute function guard_circle_avatar();
