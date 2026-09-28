-- Saved documents from the free tools (letters, transcripts, GPA, checklists).
-- These often contain a child's name and needs, so rows are private to their
-- owner. A document is readable by others only through its share token, via
-- get_shared_document(), and only while sharing is on.

create table if not exists saved_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tool text not null check (char_length(tool) <= 40),
  title text not null check (char_length(title) between 1 and 140),
  data jsonb not null check (pg_column_size(data) <= 200000),
  share_token uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_documents_user_idx on saved_documents(user_id, updated_at desc);
alter table saved_documents enable row level security;

drop policy if exists "own documents" on saved_documents;
create policy "own documents" on saved_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read of one shared document by its token (no table-wide read access).
create or replace function get_shared_document(p_token uuid)
returns table(tool text, title text, data jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select d.tool, d.title, d.data, d.updated_at from saved_documents d where d.share_token = p_token;
$$;
grant execute on function get_shared_document(uuid) to anon, authenticated;
