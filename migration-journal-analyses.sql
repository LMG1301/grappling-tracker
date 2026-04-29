-- =====================================================================
-- Migration : Journal AI analyses
-- =====================================================================
-- Stocke les syntheses reflexives generees par Claude pour des
-- entrees du journal selectionnees par l'utilisateur.
-- =====================================================================

create table if not exists public.journal_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_ids uuid[] not null,
  entry_count smallint not null,
  date_range_start date,
  date_range_end date,
  synthesis text not null,
  model_used text default 'claude-opus-4-7',
  tokens_used integer,
  created_at timestamptz default now()
);

create index if not exists idx_journal_analyses_user
  on public.journal_analyses(user_id, created_at desc);

alter table public.journal_analyses enable row level security;

drop policy if exists analyses_select_own on public.journal_analyses;
drop policy if exists analyses_insert_own on public.journal_analyses;
drop policy if exists analyses_delete_own on public.journal_analyses;

create policy analyses_select_own on public.journal_analyses
  for select using (auth.uid() = user_id);

create policy analyses_insert_own on public.journal_analyses
  for insert with check (auth.uid() = user_id);

create policy analyses_delete_own on public.journal_analyses
  for delete using (auth.uid() = user_id);
