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
