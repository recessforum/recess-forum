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
