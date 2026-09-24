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
