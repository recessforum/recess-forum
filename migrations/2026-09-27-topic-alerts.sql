-- Topic alerts: members pick the categories they care about (at signup, or
-- once on their next visit) and can opt in to an email when a new public post
-- lands in one of them.
--
-- Kept out of `profiles` on purpose: profiles are readable by everyone, and
-- the unsubscribe token and consent record must not be.

create table if not exists notification_prefs (
  user_id uuid primary key references profiles(id) on delete cascade,
  categories text[] not null default '{}',
  -- Opt-in only. Never defaults to true; set from an unchecked-by-default box.
  category_emails boolean not null default false,
  -- Consent record (when and to what wording the member agreed).
  consented_at timestamptz,
  consent_text text,
  -- Secret used by the one-click unsubscribe link in every alert email.
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  -- Daily send cap bookkeeping (written by the server with the service role).
  sent_day date,
  sent_today integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table notification_prefs enable row level security;

drop policy if exists "notification_prefs own select" on notification_prefs;
create policy "notification_prefs own select" on notification_prefs
  for select using (auth.uid() = user_id);

drop policy if exists "notification_prefs own insert" on notification_prefs;
create policy "notification_prefs own insert" on notification_prefs
  for insert with check (auth.uid() = user_id);

drop policy if exists "notification_prefs own update" on notification_prefs;
create policy "notification_prefs own update" on notification_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists notification_prefs_categories_idx
  on notification_prefs using gin (categories) where category_emails;
