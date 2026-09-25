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
