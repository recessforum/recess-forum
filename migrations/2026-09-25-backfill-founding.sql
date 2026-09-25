-- Give members who joined before account types existed their Founding Parent
-- numbers, in signup order. Everyone counts as a parent except business
-- providers, professionals/experts, Verified Experts and admins.
-- Run once in Supabase SQL Editor. Safe to re-run (it renumbers the same way).

begin;

-- Existing members with no account type yet: Verified Experts become 'expert',
-- regular members become 'parent' (so they aren't asked again).
update profiles set account_type = 'expert'
  where account_type is null and role = 'verified_expert';
update profiles set account_type = 'parent'
  where account_type is null and role = 'member';

-- Renumber 1..500 by signup date across every eligible parent, so early
-- members keep the lowest numbers.
update profiles set founding_number = null where founding_number is not null;

with ranked as (
  select id, row_number() over (order by created_at, id) as n
  from profiles
  where account_type = 'parent' and role = 'member'
)
update profiles p
set founding_number = r.n
from ranked r
where p.id = r.id and r.n <= 500;

commit;

-- Check: how many got a number.
select count(*) as founding_parents from profiles where founding_number is not null;
