-- Verified Expert alerts.
--
-- 1. Daily "still waiting for an expert" email (opt-in, experts only).
alter table notification_prefs add column if not exists expert_daily boolean not null default false;
alter table notification_prefs add column if not exists expert_daily_consented_at timestamptz;
alter table notification_prefs add column if not exists expert_daily_last_sent date;

-- 2. Ask a Verified Expert: a post's author asks a specific expert to answer.
-- Public like the post itself; only the post's author can ask, and only a
-- current Verified Expert can be asked. The API also rate-limits requests.
create table if not exists expert_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  expert_id uuid not null references profiles(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, expert_id)
);
create index if not exists expert_requests_expert_idx on expert_requests(expert_id, created_at desc);
create index if not exists expert_requests_requester_idx on expert_requests(requester_id, created_at desc);
alter table expert_requests enable row level security;

drop policy if exists "expert requests are public" on expert_requests;
create policy "expert requests are public" on expert_requests for select using (true);

drop policy if exists "post authors ask experts" on expert_requests;
create policy "post authors ask experts" on expert_requests for insert with check (
  requester_id = auth.uid()
  and expert_id <> auth.uid()
  and exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid())
  and exists (select 1 from profiles e where e.id = expert_id and e.role = 'verified_expert')
);

drop policy if exists "requesters withdraw" on expert_requests;
create policy "requesters withdraw" on expert_requests for delete using (requester_id = auth.uid());
